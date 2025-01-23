import DefaultCatcher from '../../components/LoadScreen';
import LegacyTable from '../../features/legacy_table/LegacyTable';

export default function HomeTab(): React.ReactElement {
  return (
    <DefaultCatcher>
      <LegacyTable />
      {/* <div style={{display: 'flex', justifyContent: 'center'}}>
        <Countdown />
      </div> */}
    </DefaultCatcher>
  );
}
