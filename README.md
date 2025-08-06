# Smart City Operations Demo

A unified smart city operations platform demo showcasing Visium TruContext capabilities with real-time monitoring, cross-domain correlation, and executive dashboards.

## Features

- **Executive KPIs**: Real-time metrics for energy, traffic, air quality, and infrastructure health
- **Live Map**: Placeholder for MapLibre/deck.gl 3D city visualization
- **Alerts Feed**: Real-time cross-domain alerts with severity indicators
- **Energy Panel**: Grid monitoring and load visualization
- **Network Topology**: Mock graph visualization of city infrastructure
- **Incident Management**: Cross-domain incident correlation (traffic + cyber)

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (dark theme optimized for NOC/SOC)
- **State**: Zustand for real-time data simulation
- **Visualization**: Placeholder for deck.gl, MapLibre GL, ECharts
- **Mock Data**: Simulated real-time updates every 1.5 seconds

## Getting Started

### Prerequisites

- Node.js 20.19.0+ or 22.12.0+ (required for Vite 7)
- npm or yarn

### Installation

```bash
cd smartcity-demo
npm install
npm run dev
```

### Installation & Setup

The demo has been updated to use Vite 5.4.10 and custom CSS for compatibility with Node.js v20.10.0:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**Fixed Issues:**
- ✅ Vite 7.x compatibility (downgraded to 5.4.10)
- ✅ PostCSS ES module configuration
- ✅ Removed Tailwind CSS (replaced with custom CSS)
- ✅ Simplified styling approach for better compatibility

The demo should now run successfully at http://localhost:5173/

**Styling Approach:**
- Custom CSS with utility classes mimicking Tailwind
- Dark theme optimized for command center operations
- Responsive grid layout for dashboard components

If you encounter any remaining issues:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Demo Scenarios

The demo simulates Baltimore smart city operations with:

1. **Traffic Incident**: I-95 collision with adaptive signal response
2. **Cyber Probe**: Authentication spikes on traffic control VLAN
3. **Cross-Domain Correlation**: TruContext linking physical and cyber events
4. **Real-time Metrics**: Energy load, traffic flow, air quality fluctuations

## Architecture Alignment

Based on Visium TruContext capabilities:
- Graph-based correlation engine (simulated)
- Multi-domain data fusion (IT/OT)
- Real-time situational awareness
- Executive and operational dashboards
- Baltimore partnership reference (WWT + Ubicquia)

## Next Steps for Production

1. Integrate MapLibre GL + deck.gl for 3D city visualization
2. Connect to real TruContext graph database (Neo4j)
3. Implement Kafka streaming for real-time data
4. Add MITRE ATT&CK framework overlays
5. Integrate with actual city data sources (GTFS, SCADA, CAD/RMS)
6. Deploy on cloud-native infrastructure (Kubernetes)

## File Structure

```
src/
├── components/           # React components
│   ├── ExecutiveKpis.tsx    # Top-level metrics
│   ├── LiveMap.tsx          # Map placeholder
│   ├── AlertsFeed.tsx       # Real-time alerts
│   ├── EnergyPanel.tsx      # Energy monitoring
│   ├── TopologyView.tsx     # Network graph
│   └── IncidentDetail.tsx   # Incident correlation
├── mock/                 # Mock data and simulation
│   └── useMockRealtime.ts   # Real-time data hook
├── App.tsx              # Main application
└── main.tsx             # Entry point
```

## License

Demo application for Visium Technologies smart city platform evaluation.
