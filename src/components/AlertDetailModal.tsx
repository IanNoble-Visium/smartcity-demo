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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">{alert.title}</h2>
                <div className="text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</div>
              </div>
              <button className="text-slate-400 hover:text-white" onClick={onClose}>✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="text-sm text-slate-300">{alert.description}</div>
              <div className="w-full aspect-video bg-black rounded overflow-hidden">
                <video src={videoSrc} controls autoPlay className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AlertDetailModal;