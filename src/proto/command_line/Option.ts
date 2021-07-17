// Original file: proto/command_line.proto

import type { OptionEffectTag as _options_OptionEffectTag } from '../options/OptionEffectTag';
import type { OptionMetadataTag as _options_OptionMetadataTag } from '../options/OptionMetadataTag';

/**
 * A single command line option.
 *
 * This represents the option itself, but does not take into account the type of
 * option or how the parser interpreted it. If this option is part of a command
 * line that represents the actual input that Bazel received, it would, for
 * example, include expansion flags as they are. However, if this option
 * represents the canonical form of the command line, with the values as Bazel
 * understands them, then the expansion flag, which has no value, would not
 * appear, and the flags it expands to would.
 */
export interface Option {
  /**
   * How the option looks with the option and its value combined. Depending on
   * the purpose of this command line report, this could be the canonical
   * form, or the way that the flag was set.
   *
   * Some examples: this might be `--foo=bar` form, or `--foo bar` with a space;
   * for boolean flags, `--nobaz` is accepted on top of `--baz=false` and other
   * negating values, or for a positive value, the unqualified `--baz` form
   * is also accepted. This could also be a short `-b`, if the flag has an
   * abbreviated form.
   */
  combinedForm?: string;
  /**
   * The canonical name of the option, without the preceding dashes.
   */
  optionName?: string;
  /**
   * The value of the flag, or unset for flags that do not take values.
   * Especially for boolean flags, this should be in canonical form, the
   * combined_form field above gives room for showing the flag as it was set
   * if that is preferred.
   */
  optionValue?: string;
  /**
   * This flag's tagged effects. See OptionEffectTag's java documentation for
   * details.
   */
  effectTags?: (_options_OptionEffectTag | keyof typeof _options_OptionEffectTag)[];
  /**
   * Metadata about the flag. See OptionMetadataTag's java documentation for
   * details.
   */
  metadataTags?: (_options_OptionMetadataTag | keyof typeof _options_OptionMetadataTag)[];
}

/**
 * A single command line option.
 *
 * This represents the option itself, but does not take into account the type of
 * option or how the parser interpreted it. If this option is part of a command
 * line that represents the actual input that Bazel received, it would, for
 * example, include expansion flags as they are. However, if this option
 * represents the canonical form of the command line, with the values as Bazel
 * understands them, then the expansion flag, which has no value, would not
 * appear, and the flags it expands to would.
 */
export interface Option__Output {
  /**
   * How the option looks with the option and its value combined. Depending on
   * the purpose of this command line report, this could be the canonical
   * form, or the way that the flag was set.
   *
   * Some examples: this might be `--foo=bar` form, or `--foo bar` with a space;
   * for boolean flags, `--nobaz` is accepted on top of `--baz=false` and other
   * negating values, or for a positive value, the unqualified `--baz` form
   * is also accepted. This could also be a short `-b`, if the flag has an
   * abbreviated form.
   */
  combinedForm: string;
  /**
   * The canonical name of the option, without the preceding dashes.
   */
  optionName: string;
  /**
   * The value of the flag, or unset for flags that do not take values.
   * Especially for boolean flags, this should be in canonical form, the
   * combined_form field above gives room for showing the flag as it was set
   * if that is preferred.
   */
  optionValue: string;
  /**
   * This flag's tagged effects. See OptionEffectTag's java documentation for
   * details.
   */
  effectTags: _options_OptionEffectTag[];
  /**
   * Metadata about the flag. See OptionMetadataTag's java documentation for
   * details.
   */
  metadataTags: _options_OptionMetadataTag[];
}
