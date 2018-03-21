import { utils } from '../utils/utils';

// Component Name
const COMPONENT_NAME = 'toolbarflexitem';

// Filters out hyperlinks that are part of menu/action button components
function hyperlinkFilter(elem) {
  return $(elem).parents('.popupmenu').length < 1;
}

// Toolbar Focusable Element Selectors.
// Any of these element/class types are valid toolbar items.
// TODO: Designate between "button" and "menu button"
const TOOLBAR_ELEMENTS = [
  { type: 'button', selector: 'button:not(.btn-menu):not(.btn-actions), input[type="button"]:not(.btn-menu):not(.btn-actions)' },
  { type: 'menubutton', selector: '.btn-menu, .btn-actions' },
  { type: 'hyperlink', selector: 'a[href]', filter: hyperlinkFilter },
  { type: 'checkbox', selector: 'input[type="checkbox"]' },
  { type: 'radio', selector: 'input[type="radio"]' },
  { type: 'searchfield', selector: '.searchfield' },
  { type: 'toolbarsearchfield', selector: '.toolbarsearchfield' } // temporary
];

/**
 * Default Settings
 * @namespace
 */
const TOOLBAR_FLEX_ITEM_DEFAULTS = {
  disabled: false,
  readonly: false,
  hidden: false
};

/**
 * Gets the type of Toolbar Item that an element represents.
 * @param {HTMLElement} element being checked for a toolbar item.
 * @returns {string} representing the type
 */
function getToolbarItemType(element) {
  let type = false;
  TOOLBAR_ELEMENTS.forEach((elemObj) => {
    if (!$(element).is(elemObj.selector)) {
      return;
    }
    if (typeof elemObj.filter === 'function' && !elemObj.filter(element)) {
      return;
    }
    type = elemObj.type;
  });

  if (!type) {
    throw new Error(`Element ${element} is not a valid Toolbar Item Type.`);
  }

  return type;
}

/**
 * Toolbar Item Wrapper Component
 * @constructor
 * @param {HTMLElement} element the base element
 * @param {object} [settings] incoming settings
 */
function ToolbarFlexItem(element, settings) {
  this.element = element;
  this.settings = utils.mergeSettings(this.element, settings, TOOLBAR_FLEX_ITEM_DEFAULTS);

  // Internal flags
  this.type = getToolbarItemType(element);
  this.init();
}

ToolbarFlexItem.prototype = {

  type: undefined,

  /**
   * @private
   */
  init() {
    this.handleEvents();
  },

  get focusable() {
    if (this.disabled === true) {
      return false;
    }
    return this.visible;
  },

  set focusable(boolean) {
    if (boolean === true) {
      if (this.disabled) {
        this.disabled = false;
      }
      if (!this.visible) {
        this.visible = true;
      }
    }
  },

  get focused() {
    return this.element.tabIndex === 0;
  },

  /**
   * @param {boolean} boolean, if provided, sets a focused state on the toolbar item.
   * @returns {void}
   */
  set focused(boolean) {
    if (boolean) {
      this.element.tabIndex = 0;
      return;
    }
    this.element.tabIndex = -1;
  },

  get selected() {
    return this.trueSelected;
  },

  /**
   * @param {boolean} boolean, if provided, sets a selected state on the toolbar item.
   * @returns {void}
   */
  set selected(boolean) {
    if (boolean) {
      this.trueSelected = true;
      this.element.classList.add('is-selected');
      this.triggerSelectedEvent();

      if (this.selectedAnchor) {
        delete this.selectedAnchor;
      }
      return;
    }
    this.trueSelected = false;
    this.element.classList.remove('is-selected');
  },

  /**
   * Retrieves an item's main Soho Component instance.
   * @returns {object|undefined} Soho Component instance, if applicable
   */
  get componentAPI() {
    let api;
    if (this.type === 'menubutton') {
      api = $(this.element).data('popupmenu');
    }
    if (this.type === 'hyperlink') {
      api = $(this.element).data('hyperlink');
    }
    if (this.type === 'searchfield' || this.type === 'toolbarsearchfield') {
      api = $(this.element).data('searchfield');
    }
    return api;
  },

  /**
   * @fires selected
   * @returns {void}
   */
  triggerSelectedEvent() {
    const eventArgs = [this];

    // MenuButton types pass the currently-selected anchor
    if (this.type === 'menubutton' && this.selectedAnchor) {
      eventArgs.push(this.selectedAnchor);
    }

    $(this.element).trigger('selected', eventArgs);
  },

  /**
   * @returns {void}
   */
  show() {
    this.visible = true;
  },

  /**
   * @returns {void}
   */
  hide() {
    this.visible = false;
  },

  /**
   * @param {boolean} boolean whether or not the `hidden` class should be set.
   */
  set visible(boolean) {
    if (boolean) {
      this.element.classList.remove('hidden');
      return;
    }
    this.element.classList.add('hidden');
  },

  /**
   * @returns {boolean} whether or not the Toolbar Item is visible.
   */
  get visible() {
    return this.element.className.indexOf('hidden') === -1;
  },

  /**
   * @returns {void}
   */
  enable() {
    this.disabled = false;
    if (this.hasReadonly) {
      this.readonly = false;
    }
  },

  /**
   * @returns {boolean} whether or not the element is disabled
   */
  get disabled() {
    return this.element.disabled;
  },

  /**
   * @param {boolean} boolean, if provided, sets a disabled state on the toolbar item.
   * @returns {void}
   */
  set disabled(boolean) {
    if (boolean) {
      this.element.disabled = true;
      this.readonly = false;
    }
  },

  /**
   * @returns {boolean} whether or not `readonly` as a property exists on this HTMLElement type.
   */
  get hasReadonly() {
    return 'readonly' in this.element;
  },

  /**
   * @returns {boolean} element's readonly prop
   */
  get readonly() {
    if (!this.hasReadonly) {
      return false;
    }
    return this.element.readonly;
  },

  /**
   * @param {boolean} boolean, if provided, sets a readonly state on the toolbar item, if possible.
   * @returns {void}
   */
  set readonly(boolean) {
    if (!this.hasReadonly) {
      return;
    }

    if (boolean) {
      this.disabled = false;
      this.element.disabled = false;
      this.element.readonly = true;
      return;
    }

    this.element.readonly = false;
  },

  /**
   * Sets up all event listeners for this element.
   * @returns {void}
   */
  handleEvents() {
    const self = this;

    if (this.type === 'menubutton') {
      // Listen to the Popupmenu's selected event
      $(this.element).on(`selected.${COMPONENT_NAME}`, (e, anchor) => {
        if (this.selectedAnchor) {
          return;
        }

        e.stopPropagation();
        self.selectedAnchor = anchor;
        self.selected = true;
      });
    }
  },

  /**
   * @param {object} [settings] incoming settings
   */
  updated(settings) {
    if (settings) {
      this.settings = utils.mergeSettings(this.element, settings, this.settings);
    }

    this.teardown();
    this.init();
  },

  /**
   * @returns {void}
   */
  teardown() {
    $(this.element).off(`selected.${COMPONENT_NAME}`);

    delete this.type;
    delete this.selected;
    delete this.focusable;
    delete this.visible;
    delete this.disabled;
    delete this.readonly;
    delete this.invoked;
  }

};

export { ToolbarFlexItem, getToolbarItemType, COMPONENT_NAME, TOOLBAR_ELEMENTS };
