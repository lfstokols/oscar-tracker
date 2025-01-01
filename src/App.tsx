import React, { useState } from 'react';
import NomineeTable from './components/NomineeTable';
import { Suspense } from 'react';
import UserControls from './components/UserControls';
import ErrorBoundary from './components/ErrorBoundary';

export type WatchFilter = 'all' | 'watched' | 'unwatched';

export default function App(): React.ReactElement {
	const [filterWatched, setFilterWatched] = useState<WatchFilter>('all'); // 'all', 'watched', 'unwatched'
	
	return (
		<ErrorBoundary>
			<Suspense fallback={<div>Loading app...</div>}>
				<div className="App">
					<h1>Oscar Nominee Tracker</h1>
					<UserControls filterWatched={filterWatched} setFilterWatched={setFilterWatched} />
					<NomineeTable filterWatched={filterWatched} />
				</div>
			</Suspense>
		</ErrorBoundary>
	);
}