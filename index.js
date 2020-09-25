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
      label: 'shortName',
      value: 'shortName',
      children: 'children'
    }
  }

  state = {
    options: [],
  };

  async componentDidMount() {
    const ret = await this.getRegions();
    ret.data.forEach(row => {
      row.isLeaf = !row.hasChildren;
    });
    this.setState({options: ret.data});
  }

  onChange = (value) => {
    const [country, province, city] = value;
    this.context.setFieldsValue({country, province, city});

    this.props.onChange(value);
  }

  loadData = async (selectedOptions) => {
    const isLeaf = selectedOptions.length >= 2;
    const targetOption = selectedOptions[selectedOptions.length - 1];

    targetOption.loading = true;
    const ret = await this.getRegions(targetOption.id);
    targetOption.loading = false;

    ret.data.forEach(row => {
      row.isLeaf = !row.hasChildren || isLeaf;
    });
    targetOption[this.props.fieldNames.children] = ret.data;
    this.setState({
      options: [...this.state.options],
    });
  };

  getRegions = async (parentId = 0) => {
    return $.get($.url('api/regions', {virtual: 0, parentId: parentId}));
  }

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
