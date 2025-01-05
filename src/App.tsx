import React, { useState } from "react";
import NomineeTable from "./components/NomineeTable";
import { Suspense } from "react";
import UserControls from "./components/UserControls";
import ErrorBoundary from "./components/ErrorBoundary";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import OscarAppContext from "./contexts/AppContext";
import SiteHeader from "./components/SiteHeader";

const queryClient = new QueryClient();

export type WatchFilter = "all" | "watched" | "unwatched";

export default function App(): React.ReactElement {
	const [filterWatched, setFilterWatched] = useState<WatchFilter>("all"); // 'all', 'watched', 'unwatched'

	return (
		<ErrorBoundary>
			<Suspense fallback={<LoadScreen />}>
				<QueryClientProvider client={queryClient}>
					<ReactQueryDevtools />
					<OscarAppContext>
						<div className="App">
							<SiteHeader />
							<Container maxWidth="lg">
								<Box sx={{ my: 4 }}>
									<Suspense fallback={<div>Loading app...</div>}>
										<NomineeTable />
									</Suspense>
								</Box>
							</Container>
						</div>
					</OscarAppContext>
				</QueryClientProvider>
			</Suspense>
		</ErrorBoundary>
	);
}

function LoadScreen(): React.ReactElement {
	return (
		<Backdrop
			sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
			open={true}
			onClick={() => {}}
		>
			<CircularProgress color="inherit" />
		</Backdrop>
	);
}
