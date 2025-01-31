import { useEffect,useState} from 'react';

export default function Countdown(): React.ReactElement {
  const [now, setNow] = useState(new Date());

  const timeDelta = Math.floor(Date.now() - now.getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [timeDelta]);

  return <Clock now={Date.now()} />;
}

function Clock({now}: {now: number}): React.ReactElement {
  const oscarDate = new Date('2025-03-03T00:00:00Z'); // Explicitly setting the time zone to UTC
  const diffTime = oscarDate.getTime() - now;
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
        <TimeUnit unit="Days" value={diffDays} />
        <TimeUnit unit="Hours" value={diffHours} />
        <TimeUnit unit="Minutes" value={diffMinutes} />
        <TimeUnit unit="Seconds" value={diffSeconds} />
      </div>
    </div>
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
