import path = require('path');
import { md5Hash } from '../common';

const labelRepoRegexp = new RegExp('^$|^[A-Za-z][A-Za-z0-9_]*$');
const labelPkgRegexp = new RegExp('^[A-Za-z0-9/._-]*$');
const labelNameRegexp = new RegExp('^[A-Za-z0-9_/.+=,@~-]*$');

export interface Label {
  repo: string;
  pkg: string;
  name: string;
}

export function uiUrlForLabel(id: string, s: string) {
  const label = parseLabel(s);

  let rel = [id];

  if (label.repo) {
    rel.push('external', '@' + label.repo);
  } else {
    rel.push('@');
  }
  rel.push('package');

  if (label.pkg) {
    rel.push(label.pkg);
  } else {
    rel.push(':');
  }
  if (label.name) {
    rel.push(label.name);
  }

  return rel.join('/');
}

/**
 * Parse reads a label from a string.
 * @see https://docs.bazel.build/versions/master/build-ref.html#lexi.
 */
export function parseLabel(s: string): Label {
  const origStr = s;

  let relative = true;
  let repo: string = '';

  if (s.startsWith('@')) {
    relative = false;
    const endRepo = s.indexOf('//');
    if (endRepo > 0) {
      repo = s.slice('@'.length, endRepo);
      s = s.slice(endRepo);
    } else {
      repo = s.slice('@'.length);
      s = '//:' + repo;
    }
    if (!labelRepoRegexp.test(repo)) {
      throw new SyntaxError(`label parse error: repository has invalid characters: ${origStr}`);
    }
  }

  let pkg: string = '';
  if (s.startsWith('//')) {
    relative = false;
    const endPkg = s.indexOf(':');
    if (endPkg < 0) {
      pkg = s.slice('//'.length);
      s = '';
    } else {
      pkg = s.slice('//'.length, endPkg);
      s = s.slice(endPkg);
    }
    if (!labelPkgRegexp.test(pkg)) {
      throw new SyntaxError(`label parse error: package has invalid characters: ${origStr}`);
    }
  }

  if (s === ':') {
    throw new SyntaxError(`label parse error: empty name: ${origStr}`);
  }
  let name = s;
  if (name.startsWith(':')) {
    name = name.slice(1);
  }
  if (!labelNameRegexp.test(name)) {
    throw new SyntaxError(`label parse error: name has invalid characters: ${origStr}`);
  }

  if (!pkg && !name) {
    throw new SyntaxError(`label parse error: empty package and name: ${origStr}`);
  }
  if (!name) {
    name = path.basename(pkg);
  }

  return { repo, pkg, name };
}
