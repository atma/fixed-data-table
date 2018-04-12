/**
 * Copyright Mercado Libre
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableBufferedRows
 * @typechecks
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FixedDataTableRowBuffer from 'FixedDataTableRowBuffer';
import FixedDataTableRow from 'FixedDataTableRow';

import classNames from 'classnames';
import emptyFunction from 'emptyFunction';

class FixedDataTableBufferedRows extends Component {
  static propTypes = {
    bufferRowCount: PropTypes.number,
    isScrolling: PropTypes.bool,
    defaultRowHeight: PropTypes.number.isRequired,
    firstRowIndex: PropTypes.number.isRequired,
    firstRowOffset: PropTypes.number.isRequired,
    fixedColumns: PropTypes.array.isRequired,
    fixedRightColumns: PropTypes.array.isRequired,
    height: PropTypes.number.isRequired,
    offsetTop: PropTypes.number.isRequired,
    onRowClick: PropTypes.func,
    onRowDoubleClick: PropTypes.func,
    onRowContextMenu: PropTypes.func,
    onRowMouseDown: PropTypes.func,
    onRowMouseUp: PropTypes.func,
    onRowMouseEnter: PropTypes.func,
    onRowMouseLeave: PropTypes.func,
    onRowTouchStart: PropTypes.func,
    onRowTouchEnd: PropTypes.func,
    onRowTouchMove: PropTypes.func,
    rowClassNameGetter: PropTypes.func,
    rowZIndexGetter: PropTypes.func,
    rowsCount: PropTypes.number.isRequired,
    rowHeightGetter: PropTypes.func,
    subRowHeight: PropTypes.number,
    subRowHeightGetter: PropTypes.func,
    rowExpanded: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.func,
    ]),
    rowKeyGetter: PropTypes.func,
    rowPositionGetter: PropTypes.func.isRequired,
    scrollLeft: PropTypes.number.isRequired,
    scrollableColumns: PropTypes.array.isRequired,
    showLastRowBorder: PropTypes.bool,
    width: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);

    this._getRowHeight = this._getRowHeight.bind(this);

    this._rowBuffer = new FixedDataTableRowBuffer(
      this.props.rowsCount,
      this.props.defaultRowHeight,
      this.props.height,
      this._getRowHeight,
      this.props.bufferRowCount
    );

    this.state = {
      rowsToRender: this._rowBuffer.getRows(
        this.props.firstRowIndex,
        this.props.firstRowOffset
      ),
    };

    this._getSubRowHeight = this._getSubRowHeight.bind(this);
    this._updateBuffer = this._updateBuffer.bind(this);
  }

  componentWillMount() {
    this._staticRowArray = [];
    this._initialRender = true;
  }

  componentDidMount() {
    setTimeout(this._updateBuffer, 1000);
    this._initialRender = false;
  }

  componentWillReceiveProps(/*object*/ nextProps) {
    if (nextProps.rowsCount !== this.props.rowsCount ||
      nextProps.defaultRowHeight !== this.props.defaultRowHeight ||
      nextProps.height !== this.props.height) {
      this._rowBuffer =
        new FixedDataTableRowBuffer(
          nextProps.rowsCount,
          nextProps.defaultRowHeight,
          nextProps.height,
          this._getRowHeight,
          this.props.bufferRowCount
        );
    }
    if (this.props.isScrolling && !nextProps.isScrolling) {
      this._updateBuffer();
    } else {
      this.setState({
        rowsToRender: this._rowBuffer.getRows(
          nextProps.firstRowIndex,
          nextProps.firstRowOffset
        ),
      });
    }
  }

  _updateBuffer() {
    if (this._rowBuffer) {
      this.setState({
        rowsToRender: this._rowBuffer.getRowsWithUpdatedBuffer(),
      });
    }
  }

  shouldComponentUpdate() /*boolean*/ {
    // Don't add PureRenderMixin to this component please.
    return true;
  }

  componentWillUnmount() {
    this._rowBuffer = null;
    this._staticRowArray.length = 0;
  }

  render() /*object*/ {
    var props = this.props;
    var rowClassNameGetter = props.rowClassNameGetter || emptyFunction;
    var rowZIndexGetter = props.rowZIndexGetter || emptyFunction;
    var rowPositionGetter = props.rowPositionGetter;

    var rowsToRender = this.state.rowsToRender;

    //Sort the rows, we slice first to avoid changing original
    var sortedRowsToRender = rowsToRender.slice().sort((a, b) => a - b);
    var rowPositions = {};

    //Row position calculation requires that rows are calculated in order
    sortedRowsToRender.forEach((rowIndex) => {
      rowPositions[rowIndex] = rowPositionGetter(rowIndex);
    });

    this._staticRowArray.length = rowsToRender.length;

    var baseOffsetTop = props.firstRowOffset - props.rowPositionGetter(props.firstRowIndex) + props.offsetTop;

    for (var i = 0; i < rowsToRender.length; ++i) {
      var rowIndex = rowsToRender[i];
      var currentRowHeight = this._getRowHeight(rowIndex);
      var currentSubRowHeight = this._getSubRowHeight(rowIndex);
      var rowOffsetTop = baseOffsetTop + rowPositions[rowIndex];
      var rowKey = props.rowKeyGetter ? props.rowKeyGetter(rowIndex) : i;

      var hasBottomBorder =
        rowIndex === props.rowsCount - 1 && props.showLastRowBorder;

      this._staticRowArray[i] =
        <FixedDataTableRow
          key={rowKey}
          isScrolling={props.isScrolling}
          index={rowIndex}
          width={props.width}
          height={currentRowHeight}
          subRowHeight={currentSubRowHeight}
          rowExpanded={props.rowExpanded}
          scrollLeft={Math.round(props.scrollLeft)}
          offsetTop={Math.round(rowOffsetTop)}
          fixedColumns={props.fixedColumns}
          fixedRightColumns={props.fixedRightColumns}
          scrollableColumns={props.scrollableColumns}
          onClick={props.onRowClick}
          onDoubleClick={props.onRowDoubleClick}
          onContextMenu={props.onRowContextMenu}
          onMouseDown={props.onRowMouseDown}
          onMouseUp={props.onRowMouseUp}
          onMouseEnter={props.onRowMouseEnter}
          onMouseLeave={props.onRowMouseLeave}
          onTouchStart={props.onRowTouchStart}
          onTouchEnd={props.onRowTouchEnd}
          onTouchMove={props.onRowTouchMove}
          showScrollbarY={props.showScrollbarY}
          className={classNames(
            rowClassNameGetter(rowIndex),
            'public_fixedDataTable_bodyRow',
            {
              'fixedDataTableLayout_hasBottomBorder': hasBottomBorder,
              'public_fixedDataTable_hasBottomBorder': hasBottomBorder,
            }
          )}
          zIndex={rowZIndexGetter(rowIndex)}
        />;
    }

    return <div>{this._staticRowArray}</div>;
  }

  _getRowHeight(/*number*/ index) /*number*/ {
    return this.props.rowHeightGetter ?
      this.props.rowHeightGetter(index) :
      this.props.defaultRowHeight;
  }

  _getSubRowHeight(/*number*/ index) /*number*/ {
    return this.props.subRowHeightGetter ?
      this.props.subRowHeightGetter(index) :
      this.props.subRowHeight;
  }
}

module.exports = FixedDataTableBufferedRows;
