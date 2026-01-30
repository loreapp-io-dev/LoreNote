// Component types
export type {
  Component,
  ComponentType,
  ComponentStyle,
  ConditionalStyle,
  ComponentMeta,
} from './component';

// Vault types
export type {
  Vault,
  VaultSettings,
  VaultMetadata,
  PageReference,
  VaultRegistry,
  VaultRegistryEntry,
  FolderReference,
  FileSystemItemType,
  IconType,
  TrashItem,
  TrashItemType,
} from './vault';

// Link types
export type {
  LinkBlockData,
  LinkVariant,
  BacklinkBlockData,
  LinkMetadata,
  BacklinkRecord,
  LinkIndex,
  BrokenLinkRecord,
  LinkValidationResult,
  InlineLinkFormat,
} from './link';
export {
  parseInternalLink,
  createInternalLinkValue,
  isInternalLink,
} from './link';

// Settings types
export type {
  Theme,
  AppearanceSettings,
  EditorSettings,
  FileSettings,
  AdvancedSettings,
  AppSettings,
  SettingsCategory,
} from './settings';
export { DEFAULT_SETTINGS } from './settings';
