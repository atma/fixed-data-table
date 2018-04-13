/**
 * Copyright Mercado Libre
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableCell
 * @typechecks
 */

import React, { Component } from 'react';
import FixedDataTableCellDefault from 'FixedDataTableCellDefault';
import FixedDataTableColumnReorderHandle from './FixedDataTableColumnReorderHandle';
import FixedDataTableHelper from 'FixedDataTableHelper';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import shallowEqual from 'shallowEqual';

const DIR_SIGN = FixedDataTableHelper.DIR_SIGN;

const DEFAULT_PROPS = {
  align: 'left',
  highlighted: false,
};

class FixedDataTableCell extends Component {
  /**
   * PropTypes are disabled in this component, because having them on slows
   * down the FixedDataTable hugely in DEV mode. You can enable them back for
   * development, but please don't commit this component with enabled propTypes.
   */
  static propTypes_DISABLED_FOR_PERFORMANCE = {
    isScrolling: PropTypes.bool,
    align: PropTypes.oneOf(['left', 'center', 'right']),
    className: PropTypes.string,
    highlighted: PropTypes.bool,
    width: PropTypes.number.isRequired,
    minWidth: PropTypes.number,
    maxWidth: PropTypes.number,
    height: PropTypes.number.isRequired,

    cell: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
      PropTypes.func,
    ]),

    columnKey: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    /**
     * The row index that will be passed to `cellRenderer` to render.
     */
    rowIndex: PropTypes.number.isRequired,

    /**
     * Callback for when resizer knob (in FixedDataTableCell) is clicked
     * to initialize resizing. Please note this is only on the cells
     * in the header.
     * @param number combinedWidth
     * @param number left
     * @param number width
     * @param number minWidth
     * @param number maxWidth
     * @param number|string columnKey
     * @param object event
     */
    onColumnResize: PropTypes.func,
    onColumnReorder: PropTypes.func,

    /**
     * The left offset in pixels of the cell.
     */
    left: PropTypes.number,

    /**
     * Flag for enhanced performance check
     */
    pureRendering: PropTypes.bool,

    /**
     * Whether touch is enabled or not.
     */
    touchEnabled: PropTypes.bool
  };

  static defaultProps = DEFAULT_PROPS;

  constructor(props) {
    super(props);

    this.state = {
      isReorderingThisColumn: false,
      displacement: 0,
      reorderingDisplacement: 0,
    };

    this._onColumnReorderMouseDown = this._onColumnReorderMouseDown.bind(this);
    this._onColumnResizerMouseDown = this._onColumnResizerMouseDown.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.isScrolling && this.props.rowIndex === nextProps.rowIndex) {
      return false;
    }

    //Performance check not enabled
    if (!nextProps.pureRendering) {
      return true;
    }

    const { cell: oldCell, isScrolling: oldIsScrolling, ...oldProps } = this.props;
    const { cell: newCell, isScrolling: newIsScrolling, ...newProps } = nextProps;

    if (!shallowEqual(oldProps, newProps)) {
      return true;
    }

    if (!oldCell || !newCell || oldCell.type !== newCell.type) {
      return true;
    }

    if (!shallowEqual(oldCell.props, newCell.props)) {
      return true;
    }

    return false;
  }

  componentWillReceiveProps(props) {
    var left = props.left + this.state.displacement;

    var newState = {
      isReorderingThisColumn: false
    };

    if (props.isColumnReordering) {
      var originalLeft = props.columnReorderingData.originalLeft;
      var reorderCellLeft = originalLeft + props.columnReorderingData.dragDistance;
      var farthestPossiblePoint = props.columnGroupWidth - props.columnReorderingData.columnWidth;

      // ensure the cell isn't being dragged out of the column group
      reorderCellLeft = Math.max(reorderCellLeft, 0);
      reorderCellLeft = Math.min(reorderCellLeft, farthestPossiblePoint);

      if (props.columnKey === props.columnReorderingData.columnKey) {
        newState.displacement = reorderCellLeft - props.left;
        newState.isReorderingThisColumn = true;

      } else {
        var reorderCellRight = reorderCellLeft + props.columnReorderingData.columnWidth;
        var reorderCellCenter = reorderCellLeft + (props.columnReorderingData.columnWidth / 2);
        var centerOfThisColumn = left + (props.width / 2);

        var cellIsBeforeOneBeingDragged = reorderCellCenter > centerOfThisColumn;
        var cellWasOriginallyBeforeOneBeingDragged = originalLeft > props.left;
        var changedPosition = false;


        var dragPoint, thisCellPoint;
        if (cellIsBeforeOneBeingDragged) {
          if (reorderCellLeft < centerOfThisColumn) {
            changedPosition = true;
            if (cellWasOriginallyBeforeOneBeingDragged) {
              newState.displacement = props.columnReorderingData.columnWidth;
            } else {
              newState.displacement = 0;
            }
          }
        } else {
          if (reorderCellRight > centerOfThisColumn) {
            changedPosition = true;
            if (cellWasOriginallyBeforeOneBeingDragged) {
              newState.displacement = 0;
            } else {
              newState.displacement = props.columnReorderingData.columnWidth * -1;
            }
          }
        }

        if (changedPosition) {
          if (cellIsBeforeOneBeingDragged) {
            if (!props.columnReorderingData.columnAfter) {
              props.columnReorderingData.columnAfter = props.columnKey;
            }
          } else {
            props.columnReorderingData.columnBefore = props.columnKey;
          }
        } else if (cellIsBeforeOneBeingDragged) {
          props.columnReorderingData.columnBefore = props.columnKey;
        } else if (!props.columnReorderingData.columnAfter) {
          props.columnReorderingData.columnAfter = props.columnKey;
        }

      }
    } else {
      newState.displacement = 0;
    }

    this.setState(newState);
  }

  render() {
    var {height, width, columnKey, ...props} = this.props;

    var style = {
      height,
      width,
    };

    if (DIR_SIGN === 1) {
      style.left = props.left;
    } else {
      style.right = props.left;
    }

    if (this.state.isReorderingThisColumn) {
      style.transform = `translateX(${this.state.displacement}px) translateZ(0)`;
      style.zIndex = 10;
    }

    var className = classNames(
      {
        'fixedDataTableCellLayout_main': true,
        'fixedDataTableCellLayout_lastChild': props.lastChild,
        'fixedDataTableCellLayout_alignRight': props.align === 'right',
        'fixedDataTableCellLayout_alignCenter': props.align === 'center',
        'public_fixedDataTableCell_alignRight': props.align === 'right',
        'public_fixedDataTableCell_highlighted': props.highlighted,
        'public_fixedDataTableCell_main': true,
        'public_fixedDataTableCell_hasReorderHandle': !!props.onColumnReorder,
        'public_fixedDataTableCell_reordering': this.state.isReorderingThisColumn,
      },
      props.className,
    );

    var columnResizerComponent;
    if (props.onColumnResize) {
      var columnResizerStyle = {
        height
      };
      function suppress(event) {
        event.preventDefault();
        event.stopPropagation();
      };
      columnResizerComponent = (
        <div
          className={classNames('fixedDataTableCellLayout_columnResizerContainer')}
          style={columnResizerStyle}
          onMouseDown={this._onColumnResizerMouseDown}
          onTouchStart={this.props.touchEnabled ? this._onColumnResizerMouseDown : null}
          onTouchEnd={this.props.touchEnabled ? suppress : null}
          onTouchMove={this.props.touchEnabled ? suppress : null}>
          <div
            className={classNames(
              'fixedDataTableCellLayout_columnResizerKnob',
              'public_fixedDataTableCell_columnResizerKnob',
            )}
            style={columnResizerStyle}
          />
        </div>
      );
    }

    var columnReorderComponent;
    if (props.onColumnReorder) { // header row
      columnReorderComponent = (
        <FixedDataTableColumnReorderHandle
          columnKey={this.columnKey}
          touchEnabled={this.props.touchEnabled}
          onMouseDown={this._onColumnReorderMouseDown}
          onTouchStart={this._onColumnReorderMouseDown}
          height={height}
          {...this.props}
        />
      );
    }

    var cellProps = {
      columnKey,
      height,
      width
    };

    if (props.rowIndex >= 0) {
      cellProps.rowIndex = props.rowIndex;
    }

    var content;
    if (React.isValidElement(props.cell)) {
      content = React.cloneElement(props.cell, cellProps);
    } else if (typeof props.cell === 'function') {
      content = props.cell(cellProps);
    } else {
      content = (
        <FixedDataTableCellDefault
          {...cellProps}>
          {props.cell}
        </FixedDataTableCellDefault>
      );
    }

    return (
      <div className={className} style={style}>
        {columnResizerComponent}
        {columnReorderComponent}
        {content}
      </div>
    );
  }

  _onColumnResizerMouseDown(event) {
    this.props.onColumnResize(
      this.props.left,
      this.props.width,
      this.props.minWidth,
      this.props.maxWidth,
      this.props.columnKey,
      event
    );
    /**
     * This prevents the rows from moving around when we resize the
     * headers on touch devices.
     */
    if (this.props.touchEnabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  _onColumnReorderMouseDown(event) {
    this.props.onColumnReorder(
      this.props.columnKey,
      this.props.width,
      this.props.left,
      event
    );
  }
}

module.exports = FixedDataTableCell;