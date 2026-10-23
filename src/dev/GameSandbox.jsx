import { useElixir } from "../game/useElixir";

export default function GameSandbox() {
  const { elixir, spend } = useElixir();
  return (
    <div style={{ padding: 20 }}>
      <h1>Elixir: {elixir} / 10</h1>
      <button onClick={() => spend(3)}>Spend 3</button>
    </div>
  );
}