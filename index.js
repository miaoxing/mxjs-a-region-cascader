import React from "react";
import {Cascader} from 'antd';
import PropTypes from 'prop-types';
import {FormContext} from '@mxjs/a-form';

export default class RegionCascader extends React.Component {
  static contextType = FormContext;

  static propTypes = {
    fieldNames: PropTypes.object,
  }

  static defaultProps = {
    fieldNames: {
      label: 'name',
      value: 'name',
      children: 'children'
    }
  }

  state = {
    options: [],
  };

  componentDidMount() {
    $.get($.url('api/regions')).then(ret => {
      ret.data.forEach(row => {
        row.isLeaf = false;
      });
      this.setState({options: ret.data})
    });
  }

  onChange = (value) => {
    const [country, province, city] = value;
    this.context.setFieldsValue({country, province, city});

    this.props.onChange(value);
  }

  loadData = selectedOptions => {
    const isLeaf = selectedOptions.length >= 2;
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;

    $.get($.url('api/regions', {parentId: targetOption[this.props.fieldNames.value]})).then((ret) => {
      ret.data.forEach(row => {
        row.isLeaf = isLeaf;
      });

      targetOption.loading = false;
      targetOption[this.props.fieldNames.children] = ret.data;

      this.setState({
        options: [...this.state.options],
      });
    });
  };

  render() {
    return (
      <Cascader
        options={this.state.options}
        loadData={this.loadData}
        changeOnSelect
        {...this.props}
        onChange={this.onChange}
      />
    );
  }
}
