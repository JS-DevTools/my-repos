import { default as octicons, OcticonName } from "octicons";
import * as React from "react";

export interface OcticonProps {
  name: OcticonName;
  title?: string;
}

export function Octicon({ name, title }: OcticonProps) {
  let icon = octicons[name];
  let { class: className, ...options } = icon.options;

  let props: React.SVGProps<SVGSVGElement> = {
    ...options,
    "aria-hidden": "true",
    className,
  };

  let __html = title ? `<title>${title}</title>${icon.path}` : icon.path;

  return <svg {...props} dangerouslySetInnerHTML={{ __html }} />;
}
