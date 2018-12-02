import { default as octicons, OcticonName } from "octicons";
import * as React from "react";

export function Octicon({ name }: { name: OcticonName }) {
  let icon = octicons[name];

  let props = {
    ...icon.options,
    className: icon.options.class,
  };
  delete props.class;

  return <svg {...props} dangerouslySetInnerHTML={{ __html: icon.path }} />;
}