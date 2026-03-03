import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  // Pulling exactly what we need from our global context
  const { liveValues, alerts, isConnected, clearAlert } = useWebSocket();

  // Convert the liveValues dictionary into an array so we can map over it easily
  const liveSensorsArray = Object.values(liveValues);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Global Dashboard</h2>
        {/* Simple connection indicator */}
        <span style={{ color: isConnected ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
          {isConnected ? '🟢 Live' : '🔴 Offline'}
        </span>
      </div>

      {/* --- ALERTS SECTION --- */}
      {alerts.length > 0 && (
        <div style={styles.alertsSection}>
          <h3 style={styles.sectionTitle}>⚠️ Active Alerts</h3>
          {alerts.map((alert) => (
            <div key={alert.timestamp} style={styles.alertCard}>
              <strong>{alert.sensorId}</strong>: {alert.message}
              <button 
                onClick={() => clearAlert(alert.timestamp)}
                style={styles.dismissButton}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- LIVE DATA SECTION --- */}
      <div style={styles.dataSection}>
        <h3 style={styles.sectionTitle}>Real-Time Telemetry</h3>
        {liveSensorsArray.length === 0 ? (
          <p style={{ color: '#888' }}>Waiting for sensor data...</p>
        ) : (
          <ul style={styles.dataList}>
            {liveSensorsArray.map((data) => (
              <li key={data.sensorId} style={styles.dataItem}>
                <span style={styles.sensorId}>{data.sensorId}:</span> 
                <span style={styles.sensorValue}>
                  {data.value} {/* We will fetch the unit from the REST API later! */}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Basic inline styles to make it look like a floating panel (matching your image vibe)
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '350px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '20px',
    zIndex: 10, // Ensures it sits ON TOP of the ArcGIS map
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  sectionTitle: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '10px',
  },
  alertsSection: {
    marginBottom: '20px',
  },
  alertCard: {
    backgroundColor: '#ffebee',
    borderLeft: '4px solid #f44336',
    padding: '10px',
    marginBottom: '8px',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dismissButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  dataSection: {},
  dataList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  dataItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  sensorId: {
    fontWeight: 'bold',
    color: '#555',
  },
  sensorValue: {
    color: '#000',
    fontFamily: 'monospace',
    fontSize: '15px',
  },
};