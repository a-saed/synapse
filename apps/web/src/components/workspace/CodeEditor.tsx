import Editor from "@monaco-editor/react";

export function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Editor
      height="240px"
      language="javascript"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{ minimap: { enabled: false }, fontSize: 13 }}
    />
  );
}
