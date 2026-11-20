/**
 * Diagram — the one React component every diagram type renders through
 * (only sequence-diagram exists today; a future flowchart-diagram etc.
 * reuses this unchanged). Renders the Scene inline as SVG via SceneSvg.tsx,
 * in a button that opens a fullscreen lightbox, with the mouse and the keyboard.
 *
 * Mirrors AdvancedImage.tsx's lightbox: a modal <dialog> (see
 * use-modal-dialog.ts) in a portal on document.body, rendered only once
 * `isOpen` flips true, so document.body is never touched during server-side
 * rendering.
 *
 * Wired via the `fence` node's transform in core/content/schema/nodes/fence.ts
 * (which produces a `Diagram` tag for any ```<type>-diagram fence), registered
 * in ArticlePage.tsx's components map.
 */

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { SceneSvg } from './SceneSvg.js';
import type { Scene } from '../../../types/scene.js';
import { useUiStrings } from '../../i18n/useUiStrings.js';
import { useModalDialog } from '../../use-modal-dialog.js';
import styles from './Diagram.module.css';

interface DiagramProps {
  scene: Scene;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

export function Diagram({ scene }: DiagramProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <figure className={styles.figure}>
        <button
          type="button"
          className={styles.trigger}
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
        >
          <SceneSvg scene={scene} />
        </button>
      </figure>

      {isOpen && createPortal(<DiagramLightbox scene={scene} onClose={close} />, document.body)}
    </>
  );
}

/**
 * The diagram larger, in a modal dialog, with zoom buttons and +/- keys; body
 * scroll is locked while it is open. Each opening starts at 100%, freshly
 * fitted, because the lightbox mounts anew.
 */
function DiagramLightbox({ scene, onClose }: DiagramProps & { onClose: () => void }) {
  // `zoom` is a multiplier on top of `fitScale`, not an absolute scale —
  // 100% means "the whole diagram fits the lightbox viewport", whatever
  // that takes, so small diagrams get scaled up and large ones scaled down.
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const t = useUiStrings();
  const dialogRef = useModalDialog(onClose);

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))),
    [],
  );

  // `fitScale` is how much the diagram's native size must be scaled to
  // exactly fill `wrapRef`'s content box (no padding of its own — see
  // Diagram.module.css) — measured live so it tracks viewport resizes too.
  useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    const measure = () => {
      const { clientWidth, clientHeight } = node;
      if (clientWidth > 0 && clientHeight > 0) {
        setFitScale(Math.min(clientWidth / scene.width, clientHeight / scene.height));
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [scene.width, scene.height]);

  const effectiveScale = (fitScale ?? 1) * zoom;

  // +/- zoom; Escape is the dialog's own. Body scroll is locked while open.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-') zoomOut();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [zoomIn, zoomOut]);

  return (
    <dialog ref={dialogRef} className={styles.overlay} aria-label={t.diagram.previewAriaLabel}>
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label={t.diagram.closePreviewLabel}
        type="button"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className={styles.zoomControls}>
        <button
          className={styles.zoomButton}
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN}
          aria-label={t.diagram.zoomOutLabel}
          type="button"
        >
          −
        </button>
        <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
        <button
          className={styles.zoomButton}
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX}
          aria-label={t.diagram.zoomInLabel}
          type="button"
        >
          +
        </button>
      </div>

      <div
        className={styles.lightboxViewport}
        // Drives the CSS aspect-ratio the viewport box sizes itself to (see
        // Diagram.module.css) so the box matches this diagram's own shape
        // instead of a fixed rectangle unrelated to it.
        style={{ '--diagram-ratio': scene.width / scene.height } as CSSProperties}
      >
        <div ref={wrapRef} className={styles.lightboxDiagramWrap}>
          {fitScale !== null && <SceneSvg scene={scene} scale={effectiveScale} />}
        </div>
      </div>
    </dialog>
  );
}

export default Diagram;
