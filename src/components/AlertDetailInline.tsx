import type { Alert } from '../types';

// Map alert severities to video filenames stored in the public/video folder
const videoBySeverity: Record<string, string> = {
  critical: 'Emergency_Response_Drone_and_Ambulance_Dispatch.mp4',
  high: 'Cyberattack_Visualization_and_Response.mp4',
  medium: 'Smart_Traffic_Flow_Optimization_Timelapse.mp4',
  low: 'Animated_dashboard_walkthrough_202508060020_.mp4'
};

interface AlertDetailInlineProps {
  /**
   * The alert to display. If null, nothing is rendered. When provided the
   * component renders a card containing the alert title, timestamp, full
   * description and an embedded video illustrating the nature of the alert.
   */
  alert: Alert | null;
  /**
   * Optional callback fired when the user wishes to dismiss the detail panel.
   */
  onClose?: () => void;
}

/**
 * Inline alert detail card that sits within the dashboard grid. It shows
 * comprehensive details about the selected alert along with a video. Unlike
 * the modal, this component does not overlay the page but instead fits into
 * whatever space its parent allocates. The video section has a maximum
 * height to prevent it from dominating the layout and will scale down on
 * smaller screens. The description text scrolls internally if it overflows.
 */
export function AlertDetailInline({ alert, onClose }: AlertDetailInlineProps) {
  if (!alert) return null;
  const videoSrc = `/video/${videoBySeverity[alert.severity] ?? videoBySeverity['high']}`;
  return (
    <div className="h-full flex flex-col bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
      <div className="flex items-start justify-between p-3 border-b border-slate-700/50">
        <div className="pr-4">
          <h3 className="text-base font-semibold text-white mb-1 truncate" title={alert.title}>{alert.title}</h3>
          <div className="text-xs text-slate-400">
            {new Date(alert.timestamp).toLocaleString()}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
        <div className="text-sm text-slate-300 whitespace-pre-wrap">
          {alert.description}
        </div>
        <div className="w-full max-h-[50%] bg-black rounded overflow-hidden">
          <video
            src={videoSrc}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        </div>
        {/* Additional metadata could be displayed here in the future */}
      </div>
    </div>
  );
}

export default AlertDetailInline;