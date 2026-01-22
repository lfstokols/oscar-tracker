// import {useSuspenseQuery} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {UPCOMING_OSCAR_DATE} from '../config/GlobalConstants';
// import {nextKeyDateOptions} from '../hooks/dataOptions';

export default function Countdown(): React.ReactElement {
  const [now, setNow] = useState(new Date());
  // const nextKeyDate = useSuspenseQuery(nextKeyDateOptions()).data;
  // const oscarDate = nextKeyDate?.timestamp;
  const oscarDate = UPCOMING_OSCAR_DATE;

  const timeDelta = Math.floor(Date.now() - now.getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [timeDelta]);

  // if (!oscarDate) {
  //   return TillNextYearMessage();
  // }

  const upcomingKeyDate = oscarDate.getTime();
  return <Clock now={Date.now()} then={upcomingKeyDate} />;
}

function Clock({now, then}: {now: number; then: number}): React.ReactElement {
  const diffTime = then - now;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffTime % (1000 * 60)) / 1000);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '10px',
        color: '#fff',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        margin: '20px',
        width: 'fit-content',
        height: 'fit-content',
      }}>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          textAlign: 'center',
        }}>
        {diffDays <= 0 ? (
          <TillNextYearMessage />
        ) : (
          <AllTimers
            diffDays={diffDays}
            diffHours={diffHours}
            diffMinutes={diffMinutes}
            diffSeconds={diffSeconds}
          />
        )}
      </div>
    </div>
  );
}

function AllTimers({
  diffDays,
  diffHours,
  diffMinutes,
  diffSeconds,
}: {
  diffDays: number;
  diffHours: number;
  diffMinutes: number;
  diffSeconds: number;
}): React.ReactElement {
  return (
    <>
      <TimeUnit unit="Days" value={diffDays} />
      <TimeUnit unit="Hours" value={diffHours} />
      <TimeUnit unit="Minutes" value={diffMinutes} />
      <TimeUnit unit="Seconds" value={diffSeconds} />
    </>
  );
}

function TimeUnit({value, unit}: {value: number; unit: string}) {
  return (
    <div
      style={{
        backgroundColor: '#333',
        padding: '15px',
        borderRadius: '8px',
        minWidth: '80px',
      }}>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#ffd700',
        }}>
        {value.toString().padStart(2, '0')}
      </div>
      <div
        style={{
          fontSize: '14px',
          color: '#aaa',
        }}>
        {unit}
      </div>
    </div>
  );
}

// Once they end, show this in the countdown instead of the clock
function TillNextYearMessage(): React.ReactElement {
  return <div>See you next year!</div>;
}
