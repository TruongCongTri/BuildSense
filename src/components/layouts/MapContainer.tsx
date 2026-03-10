import "@arcgis/core/assets/esri/themes/dark/main.css";
import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import SceneView from "@arcgis/core/views/SceneView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import type { Building, Sensor } from "shared/types";
import { SensorTooltip } from "../sensor/SensorTooltip";
import { createSensorMarkerURI } from "@/utils/svgIconGenerator";
import Layer from "@arcgis/core/layers/Layer";

//
interface MapContainerProps {
  buildings: Building[];
  buildingFilters: Record<string, boolean>;
  focusedBuilding: Building | null;
  sensors: Sensor[];
  onSensorClick: (sensor: Sensor) => void;
  isGlobalVisible: boolean;
  typeFilters: Record<string, boolean>;
  sensorFilters: Record<string, boolean>;
  alertingSensorIds: string[];
  focusedSensor: Sensor | null;
  playbackTimestamp?: number | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  buildings,
  buildingFilters,
  focusedBuilding,
  sensors,
  onSensorClick,
  isGlobalVisible,
  typeFilters,
  sensorFilters,
  alertingSensorIds,
  focusedSensor,
  playbackTimestamp,
}) => {
  const mapDiv = useRef<HTMLDivElement>(null);

  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const [viewInstance, setViewInstance] = useState<SceneView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);

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

  // --- 1. INITIALIZE BLANK BASEMAP ONLY ONCE ---
  useEffect(() => {
    if (!mapDiv.current) return;

    const map = new Map({ basemap: "satellite", ground: "world-elevation" });
    const view = new SceneView({
      container: mapDiv.current,
      map: map,
      environment: { lighting: { type: "sun" } },
    });

    const gLayer = new GraphicsLayer({
      elevationInfo: { mode: "absolute-height" },
    });
    map.add(gLayer);
    graphicsLayerRef.current = gLayer;

    // Wait for the ArcGIS SceneView to fully load before telling React it exists!
    view.when(() => {
      setMapInstance(map);
      setViewInstance(view);
    });

    view.ui.move(["zoom", "compass", "navigation-toggle"], "bottom-left");
    view.ui.remove("attribution");

    view.on("pointer-move", (event) => {
      view.hitTest(event).then((response) => {
        const topHit = response.results[0];
        if (
          topHit &&
          topHit.type === "graphic" &&
          topHit.graphic.layer === graphicsLayerRef.current
        ) {
          const hoveredSensorId = topHit.graphic.attributes.id;
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
        setTooltipState((prev) =>
          prev.visible ? { ...prev, visible: false } : prev,
        );
      });
    });

    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        const topHit = response.results[0];
        if (
          topHit &&
          topHit.type === "graphic" &&
          topHit.graphic.layer === graphicsLayerRef.current
        ) {
          const clickedSensorId = topHit.graphic.attributes.id;
          const clickedSensor = sensorsRef.current.find(
            (s) => s.id === clickedSensorId,
          );
          if (clickedSensor) onSensorClickRef.current(clickedSensor);
        }
      });
    });

    return () => {
      view.destroy();
    };
  }, []);

  // --- DAYLIGHT SYNC EFFECT ---
  // If playing back history, sync sun to playback. Otherwise, sync to real-world time!
  useEffect(() => {
    if (!viewInstance) return;

    // 1. TIMELINE OVERRIDE: User is scrubbing or playing historical data
    if (playbackTimestamp) {
      viewInstance.set("environment", {
        ...viewInstance.environment,
        lighting: {
          type: "sun",
          date: new Date(playbackTimestamp),
          directShadowsEnabled: true, // Enables building shadows
        }
      });
      return; // Exit here so we don't start the real-world ticker!
    }

    // 2. REAL-TIME FALLBACK: Set immediately to "Now"
    viewInstance.set("environment", {
      ...viewInstance.environment,
      lighting: {
        type: "sun",
        date: new Date(),
        directShadowsEnabled: true,
      }
    });

    // Start a background ticker to keep the shadows moving naturally (updates every 1 minute)
    const realtimeTicker = setInterval(() => {
      viewInstance.set("environment", {
        ...viewInstance.environment,
        lighting: {
          type: "sun",
          date: new Date(),
          directShadowsEnabled: true,
        }
      });
    }, 60000); // 60,000ms = 1 minute

    // Clean up the ticker if we switch back to historical playback
    return () => clearInterval(realtimeTicker);
  }, [playbackTimestamp, viewInstance]);

  // --- 2. DYNAMICALLY MOUNT/UNMOUNT BUILDING LAYERS ---
  useEffect(() => {
    if (!mapInstance) return;

    buildings.forEach((bldg) => {
      // 🌟 MAGIC: Skip if the building has no 3D model (like our hidden OSM layer)
      if (!bldg.modelUrl) return;

      const layer = mapInstance.findLayerById(bldg.id) as Layer;
      const isVisible = buildingFilters[bldg.id] ?? true;

      if (!layer) {
        Layer.fromArcGISServerUrl({
          url: bldg.modelUrl,
          properties: { id: bldg.id, title: bldg.name, visible: isVisible },
        })
          .then((autoDetectedLayer) => mapInstance.add(autoDetectedLayer))
          .catch((err) => console.error(`Failed to mount ${bldg.name}:`, err));
      } else {
        layer.visible = isVisible;
      }
    });
  }, [buildings, buildingFilters, mapInstance]);

  // --- 3. FLY CAMERA TO FOCUSED BUILDING ---
  useEffect(() => {
    if (!focusedBuilding || !viewInstance || !viewInstance.map) return;

    // 🌟 MAGIC: If the building has GPS coordinates provided, fly directly to them!
    if (focusedBuilding.coordinates && focusedBuilding.coordinates.length === 2) {
      viewInstance.goTo(
        {
          target: [focusedBuilding.coordinates[0], focusedBuilding.coordinates[1]],
          zoom: 16, // Zoom in tightly to the street
          tilt: 65, // Angled street view
          heading: 0,
        },
        { duration: 2500, easing: "cubic-in-out" }
      ).catch((err: Error) => {
        if (err.name !== "AbortError") console.error("Flight error:", err);
      });
      return; 
    }

    // Fallback logic if there are no coordinates but there IS a 3D Layer
    const existingLayer = viewInstance.map.findLayerById(focusedBuilding.id);
    if (existingLayer) {
      existingLayer.when(() => {
        if (existingLayer.fullExtent) {
          viewInstance.goTo(
            { target: existingLayer.fullExtent, tilt: 70, heading: 0 },
            { duration: 3500, easing: "cubic-in-out" }
          );
        }
      });
    }
  }, [focusedBuilding, viewInstance]);

  // --- 4. FLY CAMERA TO FOCUSED SENSOR ---
  useEffect(() => {
    if (focusedSensor && viewInstance && graphicsLayerRef.current) {
      const graphic = graphicsLayerRef.current.graphics.find(
        (g) => g.attributes.id === focusedSensor.id,
      );
      if (graphic && graphic.geometry) {
        viewInstance.goTo(
          { target: graphic.geometry, tilt: 75, scale: 400 },
          { duration: 1500, easing: "cubic-in-out" },
        );
      }
    }
  }, [focusedSensor, viewInstance]);

  // --- 5. RENDER SENSORS GLOBALLY ---
  useEffect(() => {
    if (!graphicsLayerRef.current || sensors.length === 0) return;
    const layer = graphicsLayerRef.current;
    const currentSensorIds = new Set(sensors.map((s) => s.id));

    sensors.forEach((sensor) => {
      const isAlerting = alertingSensorIds.includes(sensor.id);

      const parentBuildingId = buildings.find((b) =>
        sensor.id.startsWith(`b${buildings.indexOf(b)}`),
      )?.id;
      const isParentVisible = parentBuildingId
        ? (buildingFilters[parentBuildingId] ?? true)
        : true;

      const isNormallyVisible =
        isParentVisible &&
        isGlobalVisible &&
        typeFilters[sensor.type] !== false &&
        sensorFilters[sensor.id] !== false;
      const isGraphicVisible = isNormallyVisible || isAlerting;
      const isFocused = focusedSensor?.id === sensor.id;

      const existingGraphic = layer.graphics.find(
        (g) => g.attributes.id === sensor.id,
      );

      if (existingGraphic) {
        // --- 1. VISIBILITY CHECK ---
        if (existingGraphic.visible !== isGraphicVisible) {
          existingGraphic.visible = isGraphicVisible;
        }

        // --- 2. DIRTY CHECK FOR SYMBOL RE-RENDERS ---
        // Only generate a new SVG symbol if the state actually changed!
        if (
          existingGraphic.attributes.isAlerting !== isAlerting ||
          existingGraphic.attributes.isNormallyVisible !== isNormallyVisible ||
          existingGraphic.attributes.isFocused !== isFocused
        ) {
          const svgUrl = createSensorMarkerURI(
            sensor.type,
            isAlerting,
            isNormallyVisible,
          );
          existingGraphic.symbol = new PictureMarkerSymbol({
            url: svgUrl,
            width: isFocused ? "54px" : "36px",
            height: isFocused ? "54px" : "36px",
          });

          // Save the new state to attributes so we don't redraw it next time
          existingGraphic.attributes.isAlerting = isAlerting;
          existingGraphic.attributes.isNormallyVisible = isNormallyVisible;
          existingGraphic.attributes.isFocused = isFocused;
        }

        // 🛑 WE NEVER OVERWRITE existingGraphic.geometry HERE!
        // Overwriting geometry causes the 3D flicker. Since buildings don't move, we leave it alone.
      } else {
        // --- 3. CREATE NEW SENSOR ---
        const svgUrl = createSensorMarkerURI(
          sensor.type,
          isAlerting,
          isNormallyVisible,
        );
        const symbol = new PictureMarkerSymbol({
          url: svgUrl,
          width: isFocused ? "54px" : "36px",
          height: isFocused ? "54px" : "36px",
        });

        const point = new Point({
          longitude: Number(sensor.position.x),
          latitude: Number(sensor.position.y),
          z: Number(sensor.position.z),
        });

        layer.add(
          new Graphic({
            geometry: point,
            symbol: symbol,
            attributes: {
              id: sensor.id,
              isAlerting, // Store state on creation
              isNormallyVisible,
              isFocused,
            },
            visible: isGraphicVisible,
          }),
        );
      }
    });

    // Cleanup old sensors
    const graphicsToRemove = layer.graphics.filter(
      (g) => !currentSensorIds.has(g.attributes.id),
    );
    if (graphicsToRemove.length > 0)
      layer.removeMany(graphicsToRemove.toArray());
  }, [
    sensors,
    isGlobalVisible,
    typeFilters,
    sensorFilters,
    alertingSensorIds,
    buildingFilters,
    buildings,
    focusedSensor,
  ]);
  return (
    <div className="relative w-full h-full">
      <div ref={mapDiv} className="w-full h-full bg-background transition-colors duration-200" />
      <SensorTooltip
        visible={tooltipState.visible}
        x={tooltipState.x}
        y={tooltipState.y}
        sensor={tooltipState.sensor}
      />
    </div>
  );
};
