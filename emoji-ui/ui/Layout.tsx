import React, { ReactNode } from 'react';

interface LayoutProps {
	header?: ReactNode;
	footer?: ReactNode;
	leftSidebar?: ReactNode;
	rightSidebar?: ReactNode;
	children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = (
	{
		header,
		footer,
		leftSidebar,
		rightSidebar,
		children,
	}) => {
	return (
		<div className="fixed inset-0 grid
      grid-rows-[auto_1fr_auto]">

			<div>
				{header}
			</div>

			<div className="grid grid-cols-[auto_1fr_auto]
        overflow-hidden">

				<div className="flex flex-col">
					{leftSidebar}
				</div>

				<div className="scrollbar min-h-0 overflow-auto overscroll-contain">
					{children}
				</div>

				<div className="flex flex-col">
					{rightSidebar}
				</div>

			</div>

			<div>
				{footer}
			</div>
		</div>
	);
};