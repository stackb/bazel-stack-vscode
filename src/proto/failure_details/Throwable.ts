// Original file: proto/failure_details.proto

export interface Throwable {
  /**
   * The class name of the java.lang.Throwable.
   */
  throwableClass?: string;
  /**
   * The throwable's message.
   */
  message?: string;
  /**
   * The result of calling toString on the deepest (i.e. closest to the
   * throwable's construction site) 1000 (or fewer) StackTraceElements.
   * Unstructured to simplify string matching.
   */
  stackTrace?: string[];
}

export interface Throwable__Output {
  /**
   * The class name of the java.lang.Throwable.
   */
  throwableClass: string;
  /**
   * The throwable's message.
   */
  message: string;
  /**
   * The result of calling toString on the deepest (i.e. closest to the
   * throwable's construction site) 1000 (or fewer) StackTraceElements.
   * Unstructured to simplify string matching.
   */
  stackTrace: string[];
}
