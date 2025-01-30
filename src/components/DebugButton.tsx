import {useParams} from 'react-router-dom';
import {logToConsole} from '../utils/Logger';

export default function DebugButton(): React.ReactElement | null {
  const params = useParams();
  logToConsole(`Params value is: ${JSON.stringify(params)}`);
  return null;
}
