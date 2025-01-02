import React, { useState } from 'react';
import { WatchStatus } from './NomineeTable';

type Props = {
	initState: WatchStatus,
};

export default function MultiStateCell({ initState }: Props): React.ReactElement{
	const indexToStatus: Record<number,WatchStatus> = {
		0: WatchStatus.blank,
		1: WatchStatus.seen,
		2: WatchStatus.todo,
	};
	const statusToIndex = (stat:WatchStatus): number => {
		if (stat === WatchStatus.blank) return 0;
		if (stat === WatchStatus.seen) return 1;
		if (stat === WatchStatus.todo) return 2;
		return 0;
	};
	const [watchState, setWatchState] = useState(statusToIndex(initState));
  
	const handleInteract = () => {
	  setWatchState((prevIndex) => (prevIndex + 1) % 3);
	};
  
	return (
		<div 
			onClick={handleInteract}
			style={{ 
				cursor: 'pointer', 
				backgroundColor: watchState === 0 ? 'lightgrey' : watchState === 1 ? 'lightgreen' : 'lightgoldenrodyellow',
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