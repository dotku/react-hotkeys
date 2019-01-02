import Logger from './Logger';
import FocusOnlyKeyEventStrategy from './strategies/FocusOnlyKeyEventStrategy';
import GlobalKeyEventStrategy from './strategies/GlobalKeyEventStrategy';
import isFromFocusOnlyComponent from '../helpers/resolving-handlers/isFromFocusOnlyComponent';

/**
 * Provides a registry for keyboard sequences and events, and the handlers that should
 * be called when they are detected. Also contains the interface for processing and
 * matching keyboard events against its list of registered actions and handlers.
 * @class
 */
class KeyEventManager {
  /**
   * Creates a new KeyEventManager instance if one does not already exist or returns the
   * instance that already exists.
   * @param {Object} configuration Configuration object
   * @param {Logger} configuration.logger Logger instance
   * @returns {KeyEventManager} The key event manager instance
   */
  static getInstance(configuration = {}) {
    if (!this.instance) {
      this.instance = new KeyEventManager(configuration);
    }

    return this.instance;
  }

  static clear() {
    delete this.instance;
  }

  /**
   * Creates a new KeyEventManager instance. It is expected that only a single instance
   * will be used with a render tree.
   */
  constructor(configuration = {}) {
    this.logger = configuration.logger || new Logger('warn');

    this.focusOnlyEventStrategy =
      new FocusOnlyKeyEventStrategy({ configuration, logger: this.logger });

    this.globalEventStrategy =
      new GlobalKeyEventStrategy({ configuration, logger: this.logger }, this);

    this.lastEventSeen = null;
  }

  /********************************************************************************
   * Focus key events
   ********************************************************************************/

  /**
   * Registers the actions and handlers of a HotKeys component that has gained focus
   * @param {KeyMap} actionNameToKeyMap Map of actions to key expressions
   * @param {HandlersMap} actionNameToHandlersMap Map of actions to handler functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @returns {ComponentID} Unique component index to assign to the focused HotKeys
   *         component and passed back when handling a key event
   */
  addHotKeys(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    return this.focusOnlyEventStrategy.addHotKeys(
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );
  }

  updateHotKeys(focusTreeId, componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    return this.focusOnlyEventStrategy.updateHotKeys(
      focusTreeId,
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );
  }

  /**
   * Handles when a component loses focus by resetting the internal state, ready to
   * receive the next tree of focused HotKeys components
   * @param {FocusTreeId} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentID} componentId Index of component that is blurring
   * @returns {Boolean} Whether the component still has event propagation yet to handle
   */
  removeHotKeys(focusTreeId, componentId){
    return this.focusOnlyEventStrategy.removeHotKeys(
      focusTreeId, componentId
    )
  }

  handleKeydown(event, focusTreeId, componentId, options) {
    if (isFromFocusOnlyComponent(focusTreeId)) {
      return this.focusOnlyEventStrategy.handleKeydown(event, focusTreeId, componentId, options);
    }

    this._recordLastSeenEvent(event);
  }

  handleKeypress(event, focusTreeId, componentId, options) {
    if (isFromFocusOnlyComponent(focusTreeId)) {
      return this.focusOnlyEventStrategy.handleKeypress(event, focusTreeId, componentId, options);
    }

    this._recordLastSeenEvent(event);
  }

  handleKeyup(event, focusTreeId, componentId, options) {
    if (isFromFocusOnlyComponent(focusTreeId)) {
      return this.focusOnlyEventStrategy.handleKeyup(event, focusTreeId, componentId, options);
    }

    this._recordLastSeenEvent(event);
  }

  _recordLastSeenEvent({key, type, nativeEvent}) {
    this.lastEventSeen = {
      key, type, nativeEvent
    }
  }

  /********************************************************************************
   * Global key events
   ********************************************************************************/

  addGlobalHotKeys(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options, eventOptions) {
    return this.globalEventStrategy.addHotKeys(
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options,
      eventOptions
    );
  }

  updateGlobalHotKeys(componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options, eventOptions) {
    return this.globalEventStrategy.updateHotKeys(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options,
      eventOptions
    );
  }

  removeGlobalHotKeys(componentId) {
    return this.globalEventStrategy.removeHotKeys(componentId);
  }

  handleGlobalKeydown(event) {
    return this.globalEventStrategy.handleKeydown(event);
  }

  handleGlobalKeypress(event) {
    return this.globalEventStrategy.handleKeypress(event);
  }

  handleGlobalKeyup(event) {
    return this.globalEventStrategy.handleKeyup(event);
  }

  reactAppHistoryWithEvent(key, type) {
    const { currentEvent } = this.focusOnlyEventStrategy;

    if (currentEvent.key === key && currentEvent.type === type) {
      if (currentEvent.handled) {
        return 'handled';
      } else {
        return 'seen';
      }
    } else {
      return 'unseen';
    }
  }
}

export default KeyEventManager;
