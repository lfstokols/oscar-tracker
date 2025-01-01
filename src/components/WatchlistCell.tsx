import React, { useState } from 'react';

type Props = {
	initState: watchStatus,
};

export default function MultiStateCell({ initState }: Props): React.ReactElement{
	const indexToStatus: Record<number,watchStatus> = {
	0: '',
	1: 'seen',
	2: 'todo',
	};
	const statusToIndex: Record<watchStatus,number> = {
	'': 0,
	'seen': 1,
	'todo': 2,
	};
	const [watchState, setWatchState] = useState(statusToIndex[initState]);
  
	const handleDoubleClick = () => {
	  setWatchState((prevIndex) => (prevIndex + 1) % 3);
	};
  
	return (
		<div 
			onDoubleClick={handleDoubleClick}
			style={{ 
				cursor: 'pointer', 
				backgroundColor: watchState === 0 ? 'transparent' : watchState === 1 ? 'lightgreen' : 'lightgoldenrodyellow',
				minWidth: '50px',
				minHeight: '20px',
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				userSelect: 'none',
			}}
		>
			{indexToStatus[watchState]}
		</div>
	);
  };