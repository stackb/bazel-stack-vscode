// Original file: proto/build_event_stream.proto


/**
 * Payload of an event reporting details of a given configuration.
 */
export interface Configuration {
  'mnemonic'?: (string);
  'platformName'?: (string);
  'cpu'?: (string);
  'makeVariable'?: ({[key: string]: string});
}

/**
 * Payload of an event reporting details of a given configuration.
 */
export interface Configuration__Output {
  'mnemonic': (string);
  'platformName': (string);
  'cpu': (string);
  'makeVariable': ({[key: string]: string});
}
