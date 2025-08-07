// Cesium loader utility to handle dynamic imports
export interface CesiumModule {
  Viewer: any;
  Ion: any;
  createWorldTerrainAsync: any;
  ImageryLayer: any;
  IonImageryProvider: any;
  Cartesian3: any;
  Math: any;
  ShadowMode: any;
  createOsmBuildingsAsync: any;
  Cesium3DTileStyle: any;
  DirectionalLight: any;
  Color: any;
  HeightReference: any;
  NearFarScalar: any;
  LabelStyle: any;
  Cartesian2: any;
}

let cesiumModule: any = null;
let isLoading = false;

// Get the Cesium Ion access token from environment variables
const getCesiumIonToken = (): string | undefined => {
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (token) {
    console.log('✅ Found Cesium Ion access token in environment variables');
    return token;
  }
  console.log('⚠️ No Cesium Ion access token found in environment variables');
  return undefined;
};

// Load Cesium from CDN to avoid Node.js version compatibility issues
const loadCesiumFromCDN = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Cesium) {
      resolve((window as any).Cesium);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Cesium.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Widgets/widgets.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Set the base URL for Cesium assets
      (window as any).Cesium.buildModuleUrl.setBaseUrl('https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/');
      
      resolve((window as any).Cesium);
    };
    script.onerror = () => reject(new Error('Failed to load Cesium from CDN'));
    document.head.appendChild(script);
  });
};

export const loadCesium = async (): Promise<any> => {
  if (cesiumModule) {
    console.log('Cesium already loaded, returning cached module');
    return cesiumModule;
  }

  if (isLoading) {
    console.log('Cesium is already loading, waiting...');
    // Wait for the current loading to complete
    while (isLoading && !cesiumModule) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return cesiumModule;
  }

  console.log('loadCesium called');
  isLoading = true;

  try {
    console.log('Attempting to load Cesium from CDN...');
    const cesium = await loadCesiumFromCDN();
    console.log('Cesium CDN import successful:', cesium);
    cesiumModule = cesium;
    
    // Set Cesium base URL for assets
    if (typeof window !== 'undefined' && cesiumModule) {
      (window as any).CESIUM_BASE_URL = '/cesium/';
      console.log('Set CESIUM_BASE_URL to /cesium/');
    }
    
    // Set access token from environment variable
    if (cesiumModule?.Ion) {
      const token = getCesiumIonToken();
      if (token) {
        cesiumModule.Ion.defaultAccessToken = token;
        console.log('✅ Set Cesium Ion access token from environment variable');
      } else {
        console.warn('⚠️ VITE_CESIUM_ION_TOKEN not found in environment variables');
      }
    } else {
      console.warn('⚠️ Cesium.Ion not found in loaded module');
    }
    
    console.log('Cesium loaded successfully');
    isLoading = false;
    return cesiumModule;
  } catch (error) {
    console.error('Failed to load Cesium:', error);
    isLoading = false;
    return null;
  }
};

export const getCesium = (): CesiumModule | null => {
  return cesiumModule;
};
