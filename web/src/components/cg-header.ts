import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "cg-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}

function loadTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  return stored ?? "system";
}

/**
 * Top application header with drag-and-drop zone and a file picker button.
 * Emits `files-dropped` with a FileList when files are selected or dropped.
 */
@customElement("cg-header")
export class CgHeader extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @state() private _themeMode: ThemeMode = loadTheme();

  override connectedCallback() {
    super.connectedCallback();
    applyTheme(this._themeMode);
  }

  override render() {
    const icon =
      this._themeMode === "dark"
        ? "🌙"
        : this._themeMode === "light"
          ? "☀️"
          : "💻";
    const label =
      this._themeMode === "dark"
        ? "Dark"
        : this._themeMode === "light"
          ? "Light"
          : "System";

    return html`
      <header
        class="navbar bg-base-200 border-b border-base-300 px-4 gap-4"
        @dragover=${this._onDragOver}
        @drop=${this._onDrop}
      >
        <div class="flex-1">
          <span class="text-xl font-bold tracking-tight">certgui</span>
          <span class="text-base-content/50 text-sm ml-2">
            certificate inspector
          </span>
        </div>
        <div class="flex-none flex items-center gap-2">
          <button
            class="btn btn-ghost btn-sm gap-1"
            title="Toggle theme (current: ${label})"
            @click=${this._cycleTheme}
          >
            <span>${icon}</span>
            <span class="hidden sm:inline text-xs">${label}</span>
          </button>
          <span class="text-base-content/50 text-xs hidden md:block">
            Drop files here or
          </span>
          <label class="btn btn-primary btn-sm">
            Open file
            <input
              type="file"
              class="hidden"
              multiple
              accept=".pem,.crt,.cer,.der,.p12,.pfx,.p7b,.p7c,.csr,.crl,.key,.jwk,.json"
              @change=${this._onInputChange}
            />
          </label>
        </div>
      </header>
    `;
  }

  private _cycleTheme() {
    const next: ThemeMode =
      this._themeMode === "system"
        ? "light"
        : this._themeMode === "light"
          ? "dark"
          : "system";
    this._themeMode = next;
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  private _onDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  }

  private _onDrop(e: DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length) this._emit(files);
  }

  private _onInputChange(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files?.length) {
      this._emit(files);
      (e.target as HTMLInputElement).value = "";
    }
  }

  private _emit(files: FileList) {
    this.dispatchEvent(
      new CustomEvent("files-dropped", {
        detail: files,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-header": CgHeader;
  }
}
