import "@arcgis/core/assets/esri/themes/dark/main.css";
import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import SceneView from "@arcgis/core/views/SceneView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";

import { SensorTooltip } from "../sensor/SensorTooltip";
import type { Sensor } from "../../../shared/types";
import { createSensorMarkerURI } from "../../utils/svgIconGenerator";
import BuildingSceneLayer from "@arcgis/core/layers/BuildingSceneLayer";

interface MapContainerProps {
  sensors: Sensor[];
  onSensorClick: (sensor: Sensor) => void;
  isGlobalVisible: boolean;
  typeFilters: Record<string, boolean>;
  sensorFilters: Record<string, boolean>;
  alertingSensorIds: string[];
  showBuildingModel: boolean;
  focusedSensor: Sensor | null;
}

// --- ESRI ADMIN BUILDING REAL-WORLD BOUNDARIES ---
const BUILDING_BOUNDS = {
  lonMin: -117.196,
  lonMax: -117.1953,
  latMin: 34.0563,
  latMax: 34.0566,
  height: 15,
  groundElevation: 400,
};

export const MapContainer: React.FC<MapContainerProps> = ({
  sensors,
  onSensorClick,
  isGlobalVisible,
  typeFilters,
  sensorFilters,
  alertingSensorIds,
  showBuildingModel,
  focusedSensor,
}) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SceneView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const buildingLayerRef = useRef<BuildingSceneLayer | null>(null);

  const sensorsRef = useRef<Sensor[]>(sensors);
  useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  const onSensorClickRef = useRef(onSensorClick);
  useEffect(() => {
    onSensorClickRef.current = onSensorClick;
  }, [onSensorClick]);

  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    sensor: Sensor | null;
  }>({ visible: false, x: 0, y: 0, sensor: null });

  // --- INITIALIZE MAP & REALISTIC MULTI-TIER BUILDING ---
  useEffect(() => {
    if (!mapDiv.current) return;

    // Optional: If you ever see map loading warnings in your console, add your free ArcGIS API Key here
    // esriConfig.apiKey = "YOUR_API_KEY";

    // FIX 1: 'satellite' is the correct basemap string
    const map = new Map({ basemap: "satellite", ground: "world-elevation" });
    // LOAD THE FREE ESRI BUILDING SCENE LAYER
    const buildingLayer = new BuildingSceneLayer({
      url: "https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/BSL__4326__US_Redlands__EsriAdminBldg_PublicDemo/SceneServer",
      title: "Esri Administration Building",
    });
    map.add(buildingLayer);
    buildingLayerRef.current = buildingLayer;

    // LAYER FOR SENSORS (absolute-height locks them to exact Z meters)
    const graphicsLayer = new GraphicsLayer({
      elevationInfo: { mode: "absolute-height" },
    });
    map.add(graphicsLayer);
    graphicsLayerRef.current = graphicsLayer;

    const view = new SceneView({
      container: mapDiv.current,
      map: map,
      camera: { position: { x: -117.1956, y: 34.055, z: 460 }, tilt: 65 },
      environment: { lighting: { type: "virtual" } },
    });
    viewRef.current = view;

    // FIX 2: Wait for the Building Layer to load, then auto-fly the camera to it
    buildingLayer.when(() => {
      if (buildingLayer.fullExtent) {
        view.goTo(
          {
            target: buildingLayer.fullExtent,
            tilt: 65,
          },
          { duration: 2000, easing: "cubic-in-out" },
        ); // FIX: Updated to the new easing string!
      }
    });

    view.on("pointer-move", (event) => {
      view.hitTest(event).then((response) => {
        const topHit = response.results.length > 0 ? response.results[0] : null;

        if (topHit && topHit.type === "graphic") {
          const hitResult = topHit as { type: "graphic"; graphic: Graphic };
          if (hitResult.graphic.layer === graphicsLayerRef.current) {
            const hoveredSensorId = hitResult.graphic.attributes.id;
            const hoveredSensor = sensorsRef.current.find(
              (s) => s.id === hoveredSensorId,
            );

            if (hoveredSensor) {
              setTooltipState({
                visible: true,
                x: event.x,
                y: event.y - 10,
                sensor: hoveredSensor,
              });
              return;
            }
          }
        }
        setTooltipState((prev) =>
          prev.visible ? { ...prev, visible: false } : prev,
        );
      });
    });

    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        const topHit = response.results.length > 0 ? response.results[0] : null;

        if (topHit && topHit.type === "graphic") {
          const hitResult = topHit as { type: "graphic"; graphic: Graphic };
          if (hitResult.graphic.layer === graphicsLayerRef.current) {
            const clickedSensorId = hitResult.graphic.attributes.id;
            const clickedSensor = sensorsRef.current.find(
              (s) => s.id === clickedSensorId,
            );
            if (clickedSensor) onSensorClickRef.current(clickedSensor);
          }
        }
      });
    });

    return () => {
      if (viewRef.current) viewRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (buildingLayerRef.current)
      buildingLayerRef.current.visible = showBuildingModel;
  }, [showBuildingModel]);

  // --- DYNAMIC SENSOR PLACEMENT ---
  useEffect(() => {
    if (!graphicsLayerRef.current || sensors.length === 0) return;
    const layer = graphicsLayerRef.current;
    const currentSensorIds = new Set(sensors.map((s) => s.id));

    sensors.forEach((sensor) => {
      const isAlerting = alertingSensorIds.includes(sensor.id);
      const isNormallyVisible =
        isGlobalVisible &&
        typeFilters[sensor.type] !== false &&
        sensorFilters[sensor.id] !== false;
      const isGraphicVisible = isNormallyVisible || isAlerting;

      const svgUrl = createSensorMarkerURI(
        sensor.type,
        isAlerting,
        isNormallyVisible,
      );

      const isFocused = focusedSensor?.id === sensor.id;
      const symbol = new PictureMarkerSymbol({ 
        url: svgUrl, 
        width: isFocused ? "54px" : "36px", 
        height: isFocused ? "54px" : "36px" 
      });

      // --- SMART COORDINATE CONVERTER ---
      let lon = Number(sensor.position.x);
      let lat = Number(sensor.position.y);
      let elevation = Number(sensor.position.z);

      // If backend sends 0-1 values OR the old Vietnam coordinates (> 100),
      // forcefully map them to the California building automatically.
      if ((lon >= 0 && lon <= 1) || lon > 100) {
        // We use Math.random() here just to scatter them if they are stacked on top of each other
        lon =
          BUILDING_BOUNDS.lonMin +
          Math.random() * (BUILDING_BOUNDS.lonMax - BUILDING_BOUNDS.lonMin);
        lat =
          BUILDING_BOUNDS.latMin +
          Math.random() * (BUILDING_BOUNDS.latMax - BUILDING_BOUNDS.latMin);

        // Scatter elevation between ground floor and roof
        elevation =
          BUILDING_BOUNDS.groundElevation +
          Math.random() * BUILDING_BOUNDS.height;
      }

      const point = new Point({ longitude: lon, latitude: lat, z: elevation });

      const existingGraphic = layer.graphics.find(
        (g) => g.attributes.id === sensor.id,
      );

      if (existingGraphic) {
        existingGraphic.symbol = symbol;
        existingGraphic.geometry = point; // Update geometry in case it moved
        existingGraphic.visible = isGraphicVisible;
      } else {
        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          attributes: { id: sensor.id },
          visible: isGraphicVisible,
        });

        layer.add(graphic);
      }
    });

    const graphicsToRemove = layer.graphics.filter(
      (g) => !currentSensorIds.has(g.attributes.id),
    );
    if (graphicsToRemove.length > 0)
      layer.removeMany(graphicsToRemove.toArray());
  }, [sensors, isGlobalVisible, typeFilters, sensorFilters, alertingSensorIds]);

  useEffect(() => {
    if (focusedSensor && viewRef.current && graphicsLayerRef.current) {
      // Find the existing graphic on the map so we don't have to recalculate its coordinates
      const graphic = graphicsLayerRef.current.graphics.find(g => g.attributes.id === focusedSensor.id);
      
      if (graphic && graphic.geometry) {
        viewRef.current.goTo({
          target: graphic.geometry,
          tilt: 75,
          scale: 400 // Zoom in extremely close
        }, { duration: 1500, easing: "cubic-in-out" });
      }
    }
  }, [focusedSensor]);
  return (
    <div className="relative w-full h-full">
      <div ref={mapDiv} className="w-full h-full bg-[#121212]" />
      <SensorTooltip
        visible={tooltipState.visible}
        x={tooltipState.x}
        y={tooltipState.y}
        sensor={tooltipState.sensor}
      />
    </div>
  );
};
