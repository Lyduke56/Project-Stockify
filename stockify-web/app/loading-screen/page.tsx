async function getData() {
  const res = await fetch("https://api.example.com/data", { cache: "no-store" });
  return res.json();
}

export default async function DashboardPage() {
  const data = await getData(); // loading.tsx shows while this is pending

  return (
    <div>
      <h1>{data.title}</h1>
    </div>
  );
}