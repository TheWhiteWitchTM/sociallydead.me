"use client"

import React, { useEffect, useState } from 'react';

interface FullScreenProps {
	header?: React.ReactNode;
	footer?: React.ReactNode;
	children: React.ReactNode;
	/** Callback when user requests to close (Esc / × / etc.) */
	onRequestClose?: () => void;
	/** If provided → becomes controlled; component won't hide itself automatically */
	open?: boolean;
	/** Initial open state when uncontrolled (default: true) */
	defaultOpen?: boolean;
}

export const FullScreen: React.FC<FullScreenProps> = ({
	                                                      header,
	                                                      footer,
	                                                      children,
	                                                      onRequestClose,
	                                                      open: controlledOpen,
	                                                      defaultOpen = true,
                                                      }) => {
	const isControlled = controlledOpen !== undefined;
	const [internalOpen, setInternalOpen] = useState(defaultOpen);

	const isOpen = isControlled ? controlledOpen : internalOpen;

	// Hide internally when uncontrolled
	const requestClose = () => {
		if (!isControlled) {
			setInternalOpen(false);
		}
		onRequestClose?.();
	};

	// Escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				requestClose();
			}
		};

		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [isOpen, isControlled]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex flex-col z-[9999]">
			{header && <div className="shrink-0">{header}</div>}

			<div className="flex-1 overflow-auto">{children}</div>

			{footer && <div className="shrink-0">{footer}</div>}

			<button
				onClick={requestClose}
				className="fixed top-4 right-4 z-10 text-2xl w-10 h-10 flex items-center justify-center"
				aria-label="Close (Esc)"
				title="Close (Esc)"
			>
				❌
			</button>
		</div>
	);
};