/**
 * AdvancedImage — the `advancedImage` tag: an image with a caption, which opens larger
 * in a lightbox.
 *
 * Renders a <figure>; its image sits in a button, so the lightbox opens with
 * the mouse and with the keyboard. The lightbox is a full-screen modal
 * <dialog> (see use-modal-dialog.ts), mounted via a React portal on
 * document.body.
 *
 * SSR safety: the portal is only rendered when `isOpen` is true, which starts
 * as false — so document.body is never accessed during server-side rendering.
 *
 * A <figure> is a block element, so the `advancedImage` tag in
 * core/content/schema/tags/advanced-image.ts may only stand on its own line
 * (`inline: false`), never inside a paragraph. Registered in component-map.ts
 * and LandingPage.tsx's components map.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUiStrings } from '../../i18n/useUiStrings.js';
import { useModalDialog } from '../../use-modal-dialog.js';
import styles from './AdvancedImage.module.css';

interface AdvancedImageProps {
  src: string;
  alt?: string;
  caption?: string;
}

export function AdvancedImage({ src, alt = '', caption }: AdvancedImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const t = useUiStrings();

  return (
    <>
      <figure className={styles.figure}>
        <button
          type="button"
          className={styles.trigger}
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          // The image's alt text names the button; without one it would have no name.
          aria-label={alt || t.image.previewFallbackLabel}
        >
          <img src={src} alt={alt} className={styles.image} />
        </button>
        {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
      </figure>

      {isOpen &&
        createPortal(
          <ImageLightbox src={src} alt={alt} caption={caption} onClose={close} />,
          document.body,
        )}
    </>
  );
}

/** The image larger, in a modal dialog; body scroll is locked while it is open. */
function ImageLightbox({
  src,
  alt,
  caption,
  onClose,
}: Required<Pick<AdvancedImageProps, 'src' | 'alt'>> & {
  caption?: string;
  onClose: () => void;
}) {
  const t = useUiStrings();
  const dialogRef = useModalDialog(onClose);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.overlay}
      aria-label={alt || t.image.previewFallbackLabel}
    >
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label={t.image.closePreviewLabel}
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

      <div className={styles.lightboxImageWrap}>
        <img src={src} alt={alt} className={styles.lightboxImage} />
        {caption && <p className={styles.lightboxCaption}>{caption}</p>}
      </div>
    </dialog>
  );
}

export default AdvancedImage;
