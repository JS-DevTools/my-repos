export interface POJOof<T> {
  [key: string]: T;
}

export interface POJO extends POJOof<unknown> { }

export function mapToPOJO<K, V>(map: Map<K, V>): POJOof<V> {
  let pojo = {} as POJOof<V>;

  for (let [key, value] of map.entries()) {
    pojo[key.toString()] = value;
  }

  return pojo;
}
