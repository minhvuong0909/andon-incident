import { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>React Web</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
