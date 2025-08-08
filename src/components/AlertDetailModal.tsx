import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '../types';

interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
}

// Map alert severities to video filenames stored in the public/video folder
const videoBySeverity: Record<string, string> = {
  critical: 'Emergency_Response_Drone_and_Ambulance_Dispatch.mp4',
  high: 'Cyberattack_Visualization_and_Response.mp4',
  medium: 'Smart_Traffic_Flow_Optimization_Timelapse.mp4',
  low: 'Animated_dashboard_walkthrough_202508060020_.mp4'
};

export function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  // Determine video path based on severity; fall back to high if unknown
  const videoSrc = `/video/${videoBySeverity[alert.severity] ?? videoBySeverity['high']}`;
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></div>
          {/* Slide up panel - Optimized for viewport constraints */}
          <motion.div
            className="relative z-50 bg-slate-900 border-t border-slate-700 rounded-t-xl w-full max-w-4xl mx-auto shadow-2xl"
            style={{ height: 'min(60vh, 500px)', maxHeight: '60vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.4 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white mb-1 truncate pr-8">{alert.title}</h2>
                <div className="text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</div>
              </div>
              <button className="text-slate-400 hover:text-white flex-shrink-0" onClick={onClose}>✕</button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-3">
              <div className="text-sm text-slate-300">
                {alert.description}
              </div>
              <div className="w-full bg-black rounded overflow-hidden">
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[30vh] object-contain"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AlertDetailModal;