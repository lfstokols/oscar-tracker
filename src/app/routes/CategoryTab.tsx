import CategoryTable from '../../features/category_completion_table/CategoryCompletionTable';
import DefaultCatcher from '../../components/LoadScreen';
import DefaultTabContainer from '../../components/DefaultTabContainer';

export default function HomeTab(): React.ReactElement {
  return (
    <DefaultCatcher>
      <DefaultTabContainer>
        <CategoryTable />
      </DefaultTabContainer>
      {/* <div style={{display: 'flex', justifyContent: 'center'}}>
        <Countdown />
      </div> */}
    </DefaultCatcher>
  );
}
