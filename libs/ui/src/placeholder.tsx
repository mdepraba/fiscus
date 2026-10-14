/** Stands in for the shell until the design system arrives in Stage 2. */
export function Placeholder({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  );
}
