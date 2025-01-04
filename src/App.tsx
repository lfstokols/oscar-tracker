import React, { useState } from 'react';
import NomineeTable from './components/NomineeTable';
import { Suspense } from 'react';
import UserControls from './components/UserControls';
import ErrorBoundary from './components/ErrorBoundary';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import OscarAppContext from './contexts/AppContext';
import SiteHeader from './components/SiteHeader';

const queryClient = new QueryClient();

export type WatchFilter = 'all' | 'watched' | 'unwatched';

export default function App(): React.ReactElement {
	const [filterWatched, setFilterWatched] = useState<WatchFilter>('all'); // 'all', 'watched', 'unwatched'
	
	return (
	<Container maxWidth="lg">
		<Box sx={{ my: 4 }}>
			<Typography variant="h4" component="h1" sx={{ mb: 2 }}></Typography>
				<ErrorBoundary>
					<Suspense fallback={<div>Loading app...</div>}>
						<QueryClientProvider client={queryClient}>
							<OscarAppContext>
								<ReactQueryDevtools />
								<div className="App">
									<SiteHeader />
									<UserControls filterWatched={filterWatched} setFilterWatched={setFilterWatched} />
									<NomineeTable filterWatched={filterWatched} />
								</div>
							</OscarAppContext>
						</QueryClientProvider>
					</Suspense>
				</ErrorBoundary>
			</Box>
		</Container>
	);
}