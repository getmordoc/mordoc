import { useEffectEvent, useLayoutEffect, useRef } from 'react';

/**
 * Opens a `<dialog>` as a modal while the component that renders it is
 * mounted. The browser then moves focus into the dialog, keeps it there,
 * closes it on Escape and returns focus to where it was. A click on the
 * dialog itself, outside its content, closes it too: the dialog fills the
 * screen, so that is the backdrop.
 *
 * `onClose` runs when the browser closes the dialog, so the component can
 * stop rendering it. Closing it from a button only needs that same state
 * change: unmounting closes the dialog.
 */
export function useModalDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const handleClose = useEffectEvent(onClose);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    dialog.showModal();

    // Escape fires `cancel` right away, so the component knows before the
    // next key press; `close` follows a moment later, and is the fallback for
    // when the browser skips `cancel`. In development, React's StrictMode
    // closes and reopens the dialog at once, so a late `close` can arrive
    // while it is open again: only a dialog that stays closed has closed.
    const onCancel = () => handleClose();
    const onDialogClose = () => {
      if (!dialog.open) handleClose();
    };

    // Only a click that also started on the backdrop closes the dialog, not
    // one that started inside, such as selecting text in the search field.
    let pressedOnBackdrop = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOnBackdrop = e.target === dialog;
    };
    const onClick = (e: MouseEvent) => {
      if (pressedOnBackdrop && e.target === dialog) handleClose();
    };

    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onDialogClose);
    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('click', onClick);

    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onDialogClose);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('click', onClick);
      if (dialog.open) dialog.close();
    };
  }, []);

  return ref;
}
