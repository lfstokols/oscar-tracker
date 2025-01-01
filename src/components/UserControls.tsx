import { WatchFilter } from "../App";

type Props = {
	filterWatched: WatchFilter,
	setFilterWatched: (filter: WatchFilter) => void,
};

export default function UserControls({ filterWatched, setFilterWatched }: Props): React.ReactElement {
	return (
		<div className="controls">
			<select
				value={filterWatched}
				onChange={(e) => setFilterWatched(e.target.value as WatchFilter)}>
				<option value="all">All Movies</option>
				<option value="watched">Watched</option>
				<option value="unwatched">Not Watched</option>
			</select>
		</div>
	);
}