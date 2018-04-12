/**
 * Copyright Mercado Libre
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Scrollbar
 * @typechecks
 */

import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import DOMMouseMoveTracker from 'DOMMouseMoveTracker';
import Keys from 'Keys';
import ReactWheelHandler from 'ReactWheelHandler';

import cssVar from 'cssVar';
import classNames from 'classnames';
import emptyFunction from 'emptyFunction';
import FixedDataTableTranslateDOMPosition from 'FixedDataTableTranslateDOMPosition';

const UNSCROLLABLE_STATE = {
  position: 0,
  scrollable: false,
};

const FACE_MARGIN = parseInt(cssVar('scrollbar-face-margin'), 10);
const FACE_MARGIN_2 = FACE_MARGIN * 2;
const FACE_SIZE_MIN = 30;
const KEYBOARD_SCROLL_AMOUNT = 40;

let _lastScrolledScrollbar = null;

class Scrollbar extends PureComponent {
  static propTypes = {
    contentSize: PropTypes.number.isRequired,
    defaultPosition: PropTypes.number,
    isOpaque: PropTypes.bool,
    orientation: PropTypes.oneOf(['vertical', 'horizontal']),
    onScroll: PropTypes.func,
    position: PropTypes.number,
    size: PropTypes.number.isRequired,
    trackColor: PropTypes.oneOf(['gray']),
    zIndex: PropTypes.number,
    verticalTop: PropTypes.number
  };

  static defaultProps = {
    defaultPosition: 0,
    isOpaque: false,
    onScroll: emptyFunction,
    orientation: 'vertical',
    zIndex: 99,
  };

  constructor(props) {
    super(props);

    this.state = this._calculateState(
      props.position || props.defaultPosition || 0,
      props.size,
      props.contentSize,
      props.orientation
    );

    this._calculateState = this._calculateState.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseMoveEnd = this._onMouseMoveEnd.bind(this);
    this._onWheel = this._onWheel.bind(this);
  }

  componentWillReceiveProps(/*object*/ nextProps) {
    var controlledPosition = nextProps.position;
    if (controlledPosition === undefined) {
      this._setNextState(
        this._calculateState(
          this.state.position,
          nextProps.size,
          nextProps.contentSize,
          nextProps.orientation
        )
      );
    } else {
      this._setNextState(
        this._calculateState(
          controlledPosition,
          nextProps.size,
          nextProps.contentSize,
          nextProps.orientation
        ),
        nextProps
      );
    }
  }

  render() /*?object*/ {
    if (!this.state.scrollable) {
      return null;
    }

    var size = this.props.size;
    var mainStyle;
    var faceStyle;
    var isHorizontal = this.state.isHorizontal;
    var isVertical = !isHorizontal;
    var isActive = this.state.focused || this.state.isDragging;
    var faceSize = this.state.faceSize;
    var isOpaque = this.props.isOpaque;
    var verticalTop = this.props.verticalTop || 0;

    var mainClassName = classNames({
      'ScrollbarLayout_main': true,
      'ScrollbarLayout_mainVertical': isVertical,
      'ScrollbarLayout_mainHorizontal': isHorizontal,
      'public_Scrollbar_main': true,
      'public_Scrollbar_mainOpaque': isOpaque,
      'public_Scrollbar_mainActive': isActive,
    });

    var faceClassName = classNames({
      'ScrollbarLayout_face': true,
      'ScrollbarLayout_faceHorizontal': isHorizontal,
      'ScrollbarLayout_faceVertical': isVertical,
      'public_Scrollbar_faceActive': isActive,
      'public_Scrollbar_face': true,
    });

    var position = this.state.position * this.state.scale + FACE_MARGIN;

    if (isHorizontal) {
      mainStyle = {
        width: size,
      };
      faceStyle = {
        width: faceSize - FACE_MARGIN_2
      };
      FixedDataTableTranslateDOMPosition(faceStyle, position, 0, this._initialRender);
    } else {
      mainStyle = {
        top: verticalTop,
        height: size,
      };
      faceStyle = {
        height: faceSize - FACE_MARGIN_2,
      };
      FixedDataTableTranslateDOMPosition(faceStyle, 0, position, this._initialRender);
    }

    mainStyle.zIndex = this.props.zIndex;

    if (this.props.trackColor === 'gray') {
      mainStyle.backgroundColor = cssVar('fbui-desktop-background-light');
    }

    return (
      <div
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onKeyDown={this._onKeyDown}
        onMouseDown={this._onMouseDown}
        onWheel={this._wheelHandler.onWheel}
        className={mainClassName}
        style={mainStyle}
        tabIndex={0}>
        <div
          ref={el => {
            this.faceEl = el;
          }}
          className={faceClassName}
          style={faceStyle}
        />
      </div>
    );
  }

  componentWillMount() {
    var isHorizontal = this.props.orientation === 'horizontal';
    var onWheel = isHorizontal ? this._onWheelX : this._onWheelY;

    this._wheelHandler = new ReactWheelHandler(
      onWheel,
      this._shouldHandleX, // Should hanlde horizontal scroll
      this._shouldHandleY // Should handle vertical scroll
    );
    this._initialRender = true;
  }

  componentDidMount() {
    this._mouseMoveTracker = new DOMMouseMoveTracker(
      this._onMouseMove,
      this._onMouseMoveEnd,
      document.documentElement
    );

    if (this.props.position !== undefined &&
      this.state.position !== this.props.position) {
      this._didScroll();
    }
    this._initialRender = false;
  }

  componentWillUnmount() {
    this._nextState = null;
    this._mouseMoveTracker.releaseMouseMoves();
    if (_lastScrolledScrollbar === this) {
      _lastScrolledScrollbar = null;
    }
    delete this._mouseMoveTracker;
  }

  scrollBy(/*number*/ delta) {
    this._onWheel(delta);
  }

  _shouldHandleX(/*number*/ delta) /*boolean*/ {
    return this.props.orientation === 'horizontal' ?
      this._shouldHandleChange(delta) :
      false;
  }

  _shouldHandleY(/*number*/ delta) /*boolean*/ {
    return this.props.orientation !== 'horizontal' ?
      this._shouldHandleChange(delta) :
      false;
  }

  _shouldHandleChange(/*number*/ delta) /*boolean*/ {
    var nextState = this._calculateState(
      this.state.position + delta,
      this.props.size,
      this.props.contentSize,
      this.props.orientation
    );
    return nextState.position !== this.state.position;
  }

  _calculateState(/*number*/ position,
                  /*number*/ size,
                  /*number*/ contentSize,
                  /*string*/ orientation) /*object*/ {
    if (size < 1 || contentSize <= size) {
      return UNSCROLLABLE_STATE;
    }

    var stateKey = `${position}_${size}_${contentSize}_${orientation}`;
    if (this._stateKey === stateKey) {
      return this._stateForKey;
    }

    // There are two types of positions here.
    // 1) Phisical position: changed by mouse / keyboard
    // 2) Logical position: changed by props.
    // The logical position will be kept as as internal state and the `render()`
    // function will translate it into physical position to render.

    var isHorizontal = orientation === 'horizontal';
    var scale = size / contentSize;
    var faceSize = size * scale;

    if (faceSize < FACE_SIZE_MIN) {
      scale = (size - FACE_SIZE_MIN) / (contentSize - size);
      faceSize = FACE_SIZE_MIN;
    }

    var scrollable = true;
    var maxPosition = contentSize - size;

    if (position < 0) {
      position = 0;
    } else if (position > maxPosition) {
      position = maxPosition;
    }

    var isDragging = this._mouseMoveTracker ?
      this._mouseMoveTracker.isDragging() :
      false;

    // This function should only return flat values that can be compared quiclky
    // by `React.PureComponent`.
    var state = {
      faceSize,
      isDragging,
      isHorizontal,
      position,
      scale,
      scrollable,
    };

    // cache the state for later use.
    this._stateKey = stateKey;
    this._stateForKey = state;

    return state;
  }

  _onWheelY(/*number*/ deltaX, /*number*/ deltaY) {
    this._onWheel(deltaY);
  }

  _onWheelX(/*number*/ deltaX, /*number*/ deltaY) {
    this._onWheel(deltaX);
  }

  _onWheel(/*number*/ delta) {
    var props = this.props;

    // The mouse may move faster then the animation frame does.
    // Use `requestAnimationFrame` to avoid over-updating.
    this._setNextState(
      this._calculateState(
        this.state.position + delta,
        props.size,
        props.contentSize,
        props.orientation
      )
    );
  }

  _onMouseDown(/*object*/ event) {
    var nextState;

    if (event.target !== ReactDOM.findDOMNode(this.faceEl)) {
      // Both `offsetX` and `layerX` are non-standard DOM property but they are
      // magically available for browsers somehow.
      var nativeEvent = event.nativeEvent;
      var position = this.state.isHorizontal ?
        nativeEvent.offsetX || nativeEvent.layerX :
        nativeEvent.offsetY || nativeEvent.layerY;

      // MouseDown on the scroll-track directly, move the center of the
      // scroll-face to the mouse position.
      var props = this.props;
      position /= this.state.scale;
      nextState = this._calculateState(
        position - (this.state.faceSize * 0.5 / this.state.scale),
        props.size,
        props.contentSize,
        props.orientation
      );
    } else {
      nextState = {};
    }

    nextState.focused = true;
    this._setNextState(nextState);

    this._mouseMoveTracker.captureMouseMoves(event);
    // Focus the node so it may receive keyboard event.
    ReactDOM.findDOMNode(this).focus();
  }

  _onMouseMove(/*number*/ deltaX, /*number*/ deltaY) {
    var props = this.props;
    var delta = this.state.isHorizontal ? deltaX : deltaY;
    delta /= this.state.scale;

    this._setNextState(
      this._calculateState(
        this.state.position + delta,
        props.size,
        props.contentSize,
        props.orientation
      )
    );
  }

  _onMouseMoveEnd() {
    this._nextState = null;
    this._mouseMoveTracker.releaseMouseMoves();
    this.setState({isDragging: false});
  }

  _onKeyDown(/*object*/ event) {
    var keyCode = event.keyCode;

    if (keyCode === Keys.TAB) {
      // Let focus move off the scrollbar.
      return;
    }

    var distance = KEYBOARD_SCROLL_AMOUNT;
    var direction = 0;

    if (this.state.isHorizontal) {
      switch (keyCode) {
        case Keys.HOME:
          direction = -1;
          distance = this.props.contentSize;
          break;

        case Keys.LEFT:
          direction = -1;
          break;

        case Keys.RIGHT:
          direction = 1;
          break;

        default:
          return;
      }
    }

    if (!this.state.isHorizontal) {
      switch (keyCode) {
        case Keys.SPACE:
          if (event.shiftKey) {
            direction = -1;
          } else {
            direction = 1;
          }
          break;

        case Keys.HOME:
          direction = -1;
          distance = this.props.contentSize;
          break;

        case Keys.UP:
          direction = -1;
          break;

        case Keys.DOWN:
          direction = 1;
          break;

        case Keys.PAGE_UP:
          direction = -1;
          distance = this.props.size;
          break;

        case Keys.PAGE_DOWN:
          direction = 1;
          distance = this.props.size;
          break;

        default:
          return;
      }
    }

    event.preventDefault();

    var props = this.props;
    this._setNextState(
      this._calculateState(
        this.state.position + (distance * direction),
        props.size,
        props.contentSize,
        props.orientation
      )
    );
  }

  _onFocus() {
    this.setState({
      focused: true,
    });
  }

  _onBlur() {
    this.setState({
      focused: false,
    });
  }

  _blur() {
    var el = ReactDOM.findDOMNode(this);
    if (!el) {
      return;
    }

    try {
      this._onBlur();
      el.blur();
    } catch (oops) {
      // pass
    }
  }

  _setNextState(/*object*/ nextState, /*?object*/ props) {
    props = props || this.props;
    var controlledPosition = props.position;
    var willScroll = this.state.position !== nextState.position;
    if (controlledPosition === undefined) {
      var callback = willScroll ? this._didScroll : undefined;
      this.setState(nextState, callback);
    } else if (controlledPosition === nextState.position) {
      this.setState(nextState);
    } else {
      // Scrolling is controlled. Don't update the state and let the owner
      // to update the scrollbar instead.
      if (nextState.position !== undefined &&
        nextState.position !== this.state.position) {
        this.props.onScroll(nextState.position);
      }
      return;
    }

    if (willScroll && _lastScrolledScrollbar !== this) {
      _lastScrolledScrollbar && _lastScrolledScrollbar._blur();
      _lastScrolledScrollbar = this;
    }
  }

  _didScroll() {
    this.props.onScroll(this.state.position);
  }
}

Scrollbar.KEYBOARD_SCROLL_AMOUNT = KEYBOARD_SCROLL_AMOUNT;
Scrollbar.SIZE = parseInt(cssVar('scrollbar-size'), 10);
Scrollbar.OFFSET = 1;

module.exports = Scrollbar;
