import { Component } from "react";
import {Cascader} from 'antd';
import PropTypes from 'prop-types';
import {FormContext} from '@mxjs/a-form';
import $ from 'miaoxing';
import appendUrl from 'append-url';
import {getValue, setValue} from 'rc-field-form/lib/utils/valueUtil';

export default class RegionCascader extends Component {
  static contextType = FormContext;

  static propTypes = {
    fieldNames: PropTypes.object,
    parentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    url: PropTypes.string,
    maxLevel: PropTypes.number,
    names: PropTypes.array,
  }

  static defaultProps = {
    fieldNames: {
      label: 'shortName',
      value: 'shortName',
      children: 'children'
    },
    parentId: 0,
    url: appendUrl('regions', {virtual: 0}),
    maxLevel: 3,
    names: ['country', 'province', 'city'],
  }

  state = {
    options: [],
  };

  caches = {};

  constructor(props, context) {
    super(props, context);

    context.setOutputConverter(this.outputConverter);
  }

  async componentDidMount() {
    await this.loadRegions();
  }

  async loadRegions(values = []) {
    let options = [];
    let parentOptions = [];
    let level = 0;

    loop:
      for (const value of [this.props.parentId].concat(values)) {
        level++;
        let matchOption;
        for (const option of parentOptions) {
          if (option[this.props.fieldNames.value] === value) {
            // 如果当前选项没有子节点，则跳出不再查询下属节点
            if (option.isLeaf) {
              break loop;
            }

            // 记录当前的选项
            matchOption = option;
          }
        }

        // 优先使用 id 去查询，没有 id 才使用 value
        const data = await this.getRegionFromCache(matchOption ? matchOption.id : value);
        if (level >= this.props.maxLevel) {
          data.forEach(row => {
            row.isLeaf = true;
          });
        }

        if (value === this.props.parentId) {
          // 第一级的数据直接记录起来
          options = data;
        } else {
          matchOption.children = data;
        }

        // 记录当前层级的数据，供下级数据比较
        parentOptions = data;
      }

    this.setState({
      options: [...options],
    });
  }

  async componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.value !== this.props.value) {
      await this.loadRegions(this.props.value);
    }
  }

  outputConverter = (values) => {
    const value = getValue(values, [this.props.id]) || [];
    this.props.names.forEach((name, index) => {
      values = setValue(values, Array.isArray(name) ? name : [name], value[index]);
    });
    return values;
  };

  loadData = () => {
    // 留空，以便菜单不会自动关闭
  };

  getRegionFromCache = async (parentId) => {
    if (!this.caches[parentId]) {
      this.caches[parentId] = this.getRegions(parentId);
    }
    return this.caches[parentId];
  }

  getRegions = async (parentId) => {
    const {ret} = await $.get(appendUrl(this.props.url, {parentId}));
    ret.data.forEach(row => {
      row.isLeaf = !row.hasChildren;
    });
    return ret.data;
  }

  render() {
    const {parentId, url, maxLevel, ...props} = this.props;
    return (
      <Cascader
        options={this.state.options}
        loadData={this.loadData}
        changeOnSelect
        {...props}
      />
    );
  }
}
