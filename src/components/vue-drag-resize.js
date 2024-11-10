/**
 * 样式映射对象：用于将简短的位置标识符转换为对应的CSS属性
 * y轴: t(top顶部), m(middle中间), b(bottom底部)
 * x轴: l(left左侧), m(middle中间), r(right右侧)
 */
const styleMapping = {
    y: {
        t: 'top',
        m: 'marginTop',
        b: 'bottom',
    },
    x: {
        l: 'left',
        m: 'marginLeft',
        r: 'right',
    },
};

/**
 * 批量添加事件监听器的工具函数
 * @param {Map} events - 事件映射，key为事件名，value为回调函数
 */
function addEvents(events) {
    events.forEach((cb, eventName) => {
        document.documentElement.addEventListener(eventName, cb);
    });
}

/**
 * 批量移除事件监听器的工具函数
 * @param {Map} events - 事件映射，key为事件名，value为回调函数
 */
function removeEvents(events) {
    events.forEach((cb, eventName) => {
        document.documentElement.removeEventListener(eventName, cb);
    });
}

export default {
    name: 'vue-drag-resize',

    // 声明组件可以触发的所有事件
    emits: [
        'clicked',     // 点击事件
        'dragging',    // 拖动过程中
        'dragstop',    // 拖动结束
        'resizing',    // 调整大小过程中
        'resizestop',  // 调整大小结束
        'activated',   // 组件激活
        'deactivated', // 组件停用
    ],

    // 组件的属性定义
    props: {
        /**
         * 调整大小的手柄尺寸（像素）
         * 决定了可拖拽手柄的大小，影响用户交互的精确度
         */
        stickSize: {
            type: Number,
            default: 8,
        },

        /**
         * 父元素在X轴上的缩放比例
         * 用于在父元素被缩放时保持正确的拖拽行为
         */
        parentScaleX: {
            type: Number,
            default: 1,
        },

        /**
         * 父元素在Y轴上的缩放比例
         * 用于在父元素被缩放时保持正确的拖拽行为
         */
        parentScaleY: {
            type: Number,
            default: 1,
        },

        /**
         * 组件是否处于激活状态
         * 控制组件是否可以被交互（拖拽、调整大小）
         */
        isActive: {
            type: Boolean,
            default: false,
        },

        /**
         * 是否阻止自动激活行为
         * 设置为true时，点击组件不会自动激活
         */
        preventActiveBehavior: {
            type: Boolean,
            default: false,
        },

        /**
         * 是否可拖动
         * 控制整个组件是否可以被拖动
         */
        isDraggable: {
            type: Boolean,
            default: true,
        },

        /**
         * 是否可调整大小
         * 控制是否可以通过手柄调整组件大小
         */
        isResizable: {
            type: Boolean,
            default: true,
        },

        /**
         * 是否保持宽高比
         * 在调整大小时是否保持原有的宽高比例
         */
        aspectRatio: {
            type: Boolean,
            default: false,
        },

        /**
         * 是否限制在父元素内移动
         * 防止组件被拖出父元素边界
         */
        parentLimitation: {
            type: Boolean,
            default: false,
        },

        /**
         * 是否启用网格对齐
         * 在移动或调整大小时是否自动对齐到网格
         */
        snapToGrid: {
            type: Boolean,
            default: false,
        },

        /**
         * 网格X轴间距
         * 当启用网格对齐时，水平方向的网格大小
         */
        gridX: {
            type: Number,
            default: 50,
            validator(val) {
                return val >= 0;
            },
        },

        /**
         * 网格Y轴间距
         * 当启用网格对齐时，垂直方向的网格大小
         */
        gridY: {
            type: Number,
            default: 50,
            validator(val) {
                return val >= 0;
            },
        },

        /**
         * 父容器宽度
         * 可选，如果不设置则自动获取父元素宽度
         */
        parentW: {
            type: Number,
            default: null,
        },

        /**
         * 父容器高度
         * 可选，如果不设置则自动获取父元素高度
         */
        parentH: {
            type: Number,
            default: null,
        },

        /**
         * 最小宽度
         * 组件可以被缩小的最小宽度
         */
        minw: {
            type: Number,
            default: 50,
            validator(val) {
                return val >= 0;
            },
        },

        /**
         * 最小高度
         * 组件可以被缩小的最小高度
         */
        minh: {
            type: Number,
            default: 50,
            validator(val) {
                return val >= 0;
            },
        },

        /**
         * X轴位置
         * 组件左上角的水平坐标
         */
        x: {
            type: Number,
            default: 0,
            validator(val) {
                return typeof val === 'number';
            },
        },

        /**
         * Y轴位置
         * 组件左上角的垂直坐标
         */
        y: {
            type: Number,
            default: 0,
            validator(val) {
                return typeof val === 'number';
            },
        },

        /**
         * 组件宽度
         * 可以是具体像素值或'auto'
         */
        w: {
            type: [Number, String],
            default: 100,
            validator(val) {
                return (typeof val === 'number' && val >= 0) || val === 'auto';
            },
        },

        /**
         * 组件高度
         * 可以是具体像素值或'auto'
         */
        h: {
            type: [Number, String],
            default: 100,
            validator(val) {
                return (typeof val === 'number' && val >= 0) || val === 'auto';
            },
        },

        /**
         * Z轴层级
         * 控制组件的堆叠顺序
         */
        z: {
            type: [String, Number],
            default: 'auto',
            validator(val) {
                return (typeof val === 'string') ? val === 'auto' : val >= 0;
            },
        },

        /**
         * 自定义拖动手柄的选择器
         * 指定哪些元素可以触发拖动
         */
        dragHandle: {
            type: String,
            default: null,
        },

        /**
         * 取消拖动区域的选择器
         * 指定哪些元素不触发拖动
         */
        dragCancel: {
            type: String,
            default: null,
        },

        /**
         * 调整大小的手柄列表
         * 定义显示哪些调整大小的手柄
         */
        sticks: {
            type: Array,
            default() {
                return ['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'];
            },
        },

        /**
         * 移动轴向限制
         * 限制组件可以移动的方向
         */
        axis: {
            type: String,
            default: 'both',
            validator(val) {
                return ['x', 'y', 'both', 'none'].indexOf(val) !== -1;
            },
        },

        /**
         * 内容区域的自定义类名
         * 用于自定义组件的样式
         */
        contentClass: {
            type: String,
            required: false,
            default: '',
        },
    },

    data() {
        return {
            /**
             * 固定宽高比例值
             * 用于在调整大小时保持宽高比例
             * @type {number|null}
             */
            fixAspectRatio: null,

            /**
             * 组件当前的激活状态
             * 决定组件是否可以被交互（拖拽、调整大小）
             * @type {boolean|null}
             */
            active: null,

            /**
             * 组件的Z轴层级
             * 控制组件在页面上的堆叠顺序
             * @type {number|string|null}
             */
            zIndex: null,

            /**
             * 父容器的宽度
             * 用于计算组件的相对位置和限制范围
             * @type {number|null}
             */
            parentWidth: null,

            /**
             * 父容器的高度
             * 用于计算组件的相对位置和限制范围
             * @type {number|null}
             */
            parentHeight: null,

            /**
             * 组件左侧到父容器左边界的距离
             * 用于定位组件的水平位置
             * @type {number|null}
             */
            left: null,

            /**
             * 组件顶部到父容器上边界的距离
             * 用于定位组件的垂直位置
             * @type {number|null}
             */
            top: null,

            /**
             * 组件右侧到父容器右边界的距离
             * 用于计算组件的宽度和位置
             * @type {number|null}
             */
            right: null,

            /**
             * 组件底部到父容器下边界的距离
             * 用于计算组件的高度和位置
             * @type {number|null}
             */
            bottom: null,

            /**
             * 组件的最小高度
             * 防止组件被调整得过小
             * @type {number|null}
             */
            minHeight: null,
        };
    },

    /**
     * 组件创建前的初始化
     * 设置非响应式的内部属性
     */
    beforeCreate() {
        /**
         * 是否正在通过手柄调整大小
         * 用于跟踪组件是否处于大小调整状态
         * @type {boolean}
         */
        this.stickDrag = false;

        /**
         * 是否正在拖动整个组件
         * 用于跟踪组件是否处于拖动状态
         * @type {boolean}
         */
        this.bodyDrag = false;

        /**
         * 存储移动前的尺寸和位置信息
         * 用于计算拖动和调整大小时的位置变化
         * @type {Object}
         * @property {number} pointerX - 鼠标/触摸点的X坐标
         * @property {number} pointerY - 鼠标/触摸点的Y坐标
         * @property {number} x - 组件的X坐标
         * @property {number} y - 组件的Y坐标
         * @property {number} w - 组件的宽度
         * @property {number} h - 组件的高度
         */
        this.dimensionsBeforeMove = {
            pointerX: 0,  // 记录开始移动时指针的X坐标
            pointerY: 0,  // 记录开始移动时指针的Y坐标
            x: 0,         // 记录开始移动时组件的X坐标
            y: 0,         // 记录开始移动时组件的Y坐标
            w: 0,         // 记录开始移动时组件的宽度
            h: 0          // 记录开始移动时组件的高度
        };

        /**
         * 组件移动和调整大小的边界限制
         * 用于限制组件的移动范围和大小调整范围
         * @type {Object}
         * @property {Object} left - 左侧边界限制 {min: number|null, max: number|null}
         * @property {Object} right - 右侧边界限制 {min: number|null, max: number|null}
         * @property {Object} top - 顶部边界限制 {min: number|null, max: number|null}
         * @property {Object} bottom - 底部边界限制 {min: number|null, max: number|null}
         */
        this.limits = {
            left: { min: null, max: null },    // 左侧移动限制
            right: { min: null, max: null },   // 右侧移动限制
            top: { min: null, max: null },     // 顶部移动限制
            bottom: { min: null, max: null },  // 底部移动限制
        };

        /**
         * 当前正在操作的调整大小手柄
         * 用于标识用户正在使用哪个手柄调整大小
         * 可能的值：'tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'
         * 第一个字母表示位置：t(top), b(bottom), m(middle)
         * 第二个字母表示位置：l(left), r(right), m(middle)
         * @type {string|null}
         */
        this.currentStick = null;
    },

    mounted() {
        // 获取父元素引用并计算尺寸
        this.parentElement = this.$el.parentNode;
        this.parentWidth = this.parentW ? this.parentW : this.parentElement.clientWidth;
        this.parentHeight = this.parentH ? this.parentH : this.parentElement.clientHeight;

        // 初始化组件位置
        this.left = this.x;
        this.top = this.y;
        // 计算右侧和底部的位置（考虑自动宽高的情况）
        this.right = this.parentWidth - (this.w === 'auto' ? this.$refs.container.scrollWidth : this.w) - this.left;
        this.bottom = this.parentHeight - (this.h === 'auto' ? this.$refs.container.scrollHeight : this.h) - this.top;

        // 初始化事件监听映射
        this.domEvents = new Map([
            ['mousemove', this.move],      // 鼠标移动
            ['mouseup', this.up],          // 鼠标释放
            ['mouseleave', this.up],       // 鼠标离开
            ['mousedown', this.deselect],  // 鼠标按下
            ['touchmove', this.move],      // 触摸移动
            ['touchend', this.up],         // 触摸结束
            ['touchcancel', this.up],      // 触摸取消
            ['touchstart', this.up],       // 触摸��始
        ]);

        // 添加事件监听器
        addEvents(this.domEvents);

        // 处理自定义拖动手柄
        if (this.dragHandle) {
            [...this.$el.querySelectorAll(this.dragHandle)].forEach((dragHandle) => {
                dragHandle.setAttribute('data-drag-handle', this._uid);
            });
        }

        // 处理取消拖动区域
        if (this.dragCancel) {
            [...this.$el.querySelectorAll(this.dragCancel)].forEach((cancelHandle) => {
                cancelHandle.setAttribute('data-drag-cancel', this._uid);
            });
        }
    },

    // 组件销毁前清理
    beforeDestroy() {
        // 移除所有事件监听器
        removeEvents(this.domEvents);
    },

    methods: {
        /**
         * 取消选中状态
         * 当preventActiveBehavior为true时不执行
         */
        deselect() {
            if (this.preventActiveBehavior) {
                return;
            }
            this.active = false;
        },

        /**
         * 处理移动事件
         * 包括拖动和调整大小的移动处理
         * @param {Event} ev - 移动事件对象
         */
        move(ev) {
            // 如果没有在拖动或调整大小，则不处理
            if (!this.stickDrag && !this.bodyDrag) {
                return;
            }

            ev.stopPropagation();

            // 获取鼠标/触摸的位置坐标
            const pageX = typeof ev.pageX !== 'undefined' ? ev.pageX : ev.touches[0].pageX;
            const pageY = typeof ev.pageY !== 'undefined' ? ev.pageY : ev.touches[0].pageY;

            const { dimensionsBeforeMove } = this;

            // 计算移动的距离（考虑父元素缩放）
            const delta = {
                x: (dimensionsBeforeMove.pointerX - pageX) / this.parentScaleX,
                y: (dimensionsBeforeMove.pointerY - pageY) / this.parentScaleY,
            };

            // 处理不同类型的移动
            if (this.stickDrag) {
                this.stickMove(delta);  // 处理调整大小
            }

            if (this.bodyDrag) {
                // 根据axis属性限制移动方向
                if (this.axis === 'x') {
                    delta.y = 0;  // 只允许水平移动
                } else if (this.axis === 'y') {
                    delta.x = 0;  // 只允许垂直移动
                } else if (this.axis === 'none') {
                    return;       // 禁止移动
                }
                this.bodyMove(delta);  // 处理整体移动
            }
        },

        /**
         * 处理鼠标/触摸释放事件
         * @param {Event} ev - 事件对象
         */
        up(ev) {
            if (this.stickDrag) {
                this.stickUp(ev);
            } else if (this.bodyDrag) {
                this.bodyUp(ev);
            }
        },

        /**
         * 处理组件被点击拖动的开始
         * @param {Event} ev - 事件对象
         */
        bodyDown(ev) {
            const { target, button } = ev;

            // 处理激活状态
            if (!this.preventActiveBehavior) {
                this.active = true;
            }

            // 只响应鼠标左键
            if (button && button !== 0) {
                return;
            }

            this.$emit('clicked', ev);

            if (!this.active) {
                return;
            }

            // 检查是否点击了自定义拖动手柄
            if (this.dragHandle && target.getAttribute('data-drag-handle') !== this._uid.toString()) {
                return;
            }

            // 检查是否点击了取消拖动区域
            if (this.dragCancel && target.getAttribute('data-drag-cancel') === this._uid.toString()) {
                return;
            }

            // 阻止事件冒泡和默认行为
            if (typeof ev.stopPropagation !== 'undefined') {
                ev.stopPropagation();
            }
            if (typeof ev.preventDefault !== 'undefined') {
                ev.preventDefault();
            }

            // 如果组件可拖动，启动拖动状态
            if (this.isDraggable) {
                this.bodyDrag = true;
            }

            // 记录开始拖动时的位置信息
            const pointerX = typeof ev.pageX !== 'undefined' ? ev.pageX : ev.touches[0].pageX;
            const pointerY = typeof ev.pageY !== 'undefined' ? ev.pageY : ev.touches[0].pageY;

            this.saveDimensionsBeforeMove({ pointerX, pointerY });

            // 如果启用了父元素限制，计算移动边界
            if (this.parentLimitation) {
                this.limits = this.calcDragLimitation();
            }
        },

        /**
         * 处理组件整体移动
         * @param {Object} delta - 移动的距离对象 {x, y}
         */
        bodyMove(delta) {
            const { dimensionsBeforeMove, parentWidth, parentHeight, gridX, gridY, width, height } = this;

            // 计算新的位置
            let newTop = dimensionsBeforeMove.top - delta.y;
            let newBottom = dimensionsBeforeMove.bottom + delta.y;
            let newLeft = dimensionsBeforeMove.left - delta.x;
            let newRight = dimensionsBeforeMove.right + delta.x;

            // 如果启用了网格对齐
            if (this.snapToGrid) {
                let alignTop = true;
                let alignLeft = true;

                // 计算与网格的偏差
                let diffT = newTop - Math.floor(newTop / gridY) * gridY;
                let diffB = (parentHeight - newBottom) - Math.floor((parentHeight - newBottom) / gridY) * gridY;
                let diffL = newLeft - Math.floor(newLeft / gridX) * gridX;
                let diffR = (parentWidth - newRight) - Math.floor((parentWidth - newRight) / gridX) * gridX;

                // 处理网格吸附
                if (diffT > (gridY / 2)) {
                    diffT -= gridY;
                }
                if (diffB > (gridY / 2)) {
                    diffB -= gridY;
                }
                if (diffL > (gridX / 2)) {
                    diffL -= gridX;
                }
                if (diffR > (gridX / 2)) {
                    diffR -= gridX;
                }

                // 决定对齐方向
                if (Math.abs(diffB) < Math.abs(diffT)) {
                    alignTop = false;
                }
                if (Math.abs(diffR) < Math.abs(diffL)) {
                    alignLeft = false;
                }

                // 应用网格对齐
                newTop -= (alignTop ? diffT : diffB);
                newBottom = parentHeight - height - newTop;
                newLeft -= (alignLeft ? diffL : diffR);
                newRight = parentWidth - width - newLeft;
            }

            // 应用位置限制并更新组件位置
            ({
                newLeft: this.left,
                newRight: this.right,
                newTop: this.top,
                newBottom: this.bottom,
            } = this.rectCorrectionByLimit({ newLeft, newRight, newTop, newBottom }));

            // 触发拖动事件
            this.$emit('dragging', this.rect);
        },

        /**
         * 处理组件拖动结束
         */
        bodyUp() {
            this.bodyDrag = false;
            // 触发拖动相关事件
            this.$emit('dragging', this.rect);
            this.$emit('dragstop', this.rect);

            // 重置移动前的尺寸记录
            this.dimensionsBeforeMove = { pointerX: 0, pointerY: 0, x: 0, y: 0, w: 0, h: 0 };

            // 重置限制
            this.limits = {
                left: { min: null, max: null },
                right: { min: null, max: null },
                top: { min: null, max: null },
                bottom: { min: null, max: null },
            };
        },

        /**
         * 处理调整大小手柄的按下事件
         * @param {string} stick - 手柄标识符
         * @param {Event} ev - 事件对象
         * @param {boolean} force - 是否强制执行
         */
        stickDown(stick, ev, force = false) {
            // 检查是否可以调整大小
            if ((!this.isResizable || !this.active) && !force) {
                return;
            }

            this.stickDrag = true;

            // 获取指针位置
            const pointerX = typeof ev.pageX !== 'undefined' ? ev.pageX : ev.touches[0].pageX;
            const pointerY = typeof ev.pageY !== 'undefined' ? ev.pageY : ev.touches[0].pageY;

            // 保存移动前的尺寸信息
            this.saveDimensionsBeforeMove({ pointerX, pointerY });

            // 记录当前操作的手柄
            this.currentStick = stick;

            // 计算调整大小的限制
            this.limits = this.calcResizeLimits();
        },

        /**
         * 保存移动前的尺寸和位置信息
         * @param {Object} param0 - 包含指针位置的对象
         */
        saveDimensionsBeforeMove({ pointerX, pointerY }) {
            this.dimensionsBeforeMove.pointerX = pointerX;
            this.dimensionsBeforeMove.pointerY = pointerY;

            this.dimensionsBeforeMove.left = this.left;
            this.dimensionsBeforeMove.right = this.right;
            this.dimensionsBeforeMove.top = this.top;
            this.dimensionsBeforeMove.bottom = this.bottom;

            this.dimensionsBeforeMove.width = this.width;
            this.dimensionsBeforeMove.height = this.height;

            // 计算宽高比
            this.aspectFactor = this.width / this.height;
        },

        /**
         * 处理调整大小的移动
         * @param {Object} delta - 移动的距离
         */
        stickMove(delta) {
            const {
                currentStick,
                dimensionsBeforeMove,
                gridY,
                gridX,
                snapToGrid,
                parentHeight,
                parentWidth,
            } = this;

            // 初始化新位置
            let newTop = dimensionsBeforeMove.top;
            let newBottom = dimensionsBeforeMove.bottom;
            let newLeft = dimensionsBeforeMove.left;
            let newRight = dimensionsBeforeMove.right;

            // 根据当前操作的手柄处理垂直方向的调整
            switch (currentStick[0]) {
                case 'b': // 底部
                    newBottom = dimensionsBeforeMove.bottom + delta.y;
                    if (snapToGrid) {
                        newBottom = parentHeight - Math.round((parentHeight - newBottom) / gridY) * gridY;
                    }
                    break;

                case 't': // 顶部
                    newTop = dimensionsBeforeMove.top - delta.y;
                    if (snapToGrid) {
                        newTop = Math.round(newTop / gridY) * gridY;
                    }
                    break;
                default:
                    break;
            }

            // 根据当前操作的手柄处理水平方向的调整
            switch (currentStick[1]) {
                case 'r': // 右侧
                    newRight = dimensionsBeforeMove.right + delta.x;
                    if (snapToGrid) {
                        newRight = parentWidth - Math.round((parentWidth - newRight) / gridX) * gridX;
                    }
                    break;

                case 'l': // 左
                    newLeft = dimensionsBeforeMove.left - delta.x;
                    if (snapToGrid) {
                        newLeft = Math.round(newLeft / gridX) * gridX;
                    }
                    break;
                default:
                    break;
            }

            // 应用位置限制并更新组件位置
            ({
                newLeft,
                newRight,
                newTop,
                newBottom,
            } = this.rectCorrectionByLimit({ newLeft, newRight, newTop, newBottom }));

            // 如果启用了宽高比例锁定，进行相应调整
            if (this.aspectRatio) {
                ({
                    newLeft,
                    newRight,
                    newTop,
                    newBottom,
                } = this.rectCorrectionByAspectRatio({ newLeft, newRight, newTop, newBottom }));
            }

            // 更新组件位置
            this.left = newLeft;
            this.right = newRight;
            this.top = newTop;
            this.bottom = newBottom;

            // 触发调整大小事件
            this.$emit('resizing', this.rect);
        },

        /**
         * 处理调整大小结束
         */
        stickUp() {
            this.stickDrag = false;
            // 重置移动前的尺寸记录
            this.dimensionsBeforeMove = {
                pointerX: 0,
                pointerY: 0,
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            };
            // 重置限制
            this.limits = {
                left: { min: null, max: null },
                right: { min: null, max: null },
                top: { min: null, max: null },
                bottom: { min: null, max: null },
            };

            // 触发相关事件
            this.$emit('resizing', this.rect);
            this.$emit('resizestop', this.rect);
        },

        /**
         * 计算拖动时的边界限制
         * @returns {Object} 返回各个方向的限制值
         */
        calcDragLimitation() {
            const { parentWidth, parentHeight } = this;

            return {
                left: { min: 0, max: parentWidth - this.width },
                right: { min: 0, max: parentWidth - this.width },
                top: { min: 0, max: parentHeight - this.height },
                bottom: { min: 0, max: parentHeight - this.height },
            };
        },

        /**
         * 计算调整大小时的限制
         * @returns {Object} 返回各个方向的限制值
         */
        calcResizeLimits() {
            const { aspectFactor, width, height, bottom, top, left, right } = this;
            let { minh: minHeight, minw: minWidth } = this;

            // 父元素限制，如果启用则最小值为0，否则为null（无限制）
            const parentLim = this.parentLimitation ? 0 : null;

            // 如果启用了宽高比例锁定，调整最小宽高
            if (this.aspectRatio) {
                if (minWidth / minHeight > aspectFactor) {
                    minHeight = minWidth / aspectFactor;
                } else {
                    minWidth = aspectFactor * minHeight;
                }
            }

            // 基本限制
            const limits = {
                left: { min: parentLim, max: left + (width - minWidth) },
                right: { min: parentLim, max: right + (width - minWidth) },
                top: { min: parentLim, max: top + (height - minHeight) },
                bottom: { min: parentLim, max: bottom + (height - minHeight) },
            };

            // 如果启用了宽高比例锁定，计算额外的限制
            if (this.aspectRatio) {
                const aspectLimits = {
                    left: {
                        min: left - (Math.min(top, bottom) * aspectFactor) * 2,
                        max: left + ((((height - minHeight) / 2) * aspectFactor) * 2),
                    },
                    right: {
                        min: right - (Math.min(top, bottom) * aspectFactor) * 2,
                        max: right + ((((height - minHeight) / 2) * aspectFactor) * 2),
                    },
                    top: {
                        min: top - (Math.min(left, right) / aspectFactor) * 2,
                        max: top + ((((width - minWidth) / 2) / aspectFactor) * 2),
                    },
                    bottom: {
                        min: bottom - (Math.min(left, right) / aspectFactor) * 2,
                        max: bottom + ((((width - minWidth) / 2) / aspectFactor) * 2),
                    },
                };

                // 根据当前操作的手柄应用不同的限制
                if (this.currentStick[0] === 'm') {
                    limits.left = {
                        min: Math.max(limits.left.min, aspectLimits.left.min),
                        max: Math.min(limits.left.max, aspectLimits.left.max),
                    };
                    limits.right = {
                        min: Math.max(limits.right.min, aspectLimits.right.min),
                        max: Math.min(limits.right.max, aspectLimits.right.max),
                    };

                } else if (this.currentStick[1] === 'm') {
                    limits.top = {
                        min: Math.max(limits.top.min, aspectLimits.top.min),
                        max: Math.min(limits.top.max, aspectLimits.top.max),
                    };
                    limits.bottom = {
                        min: Math.max(limits.bottom.min, aspectLimits.bottom.min),
                        max: Math.min(limits.bottom.max, aspectLimits.bottom.max),
                    };
                }
            }

            return limits;
        },

        /**
         * 根据限制值修正单个边的位置
         * @param {Object} limit - 限制值对象，包含min和max
         * @param {number} current - 当前值
         * @returns {number} 修正后的值
         */
        sideCorrectionByLimit(limit, current) {
            let value = current;

            if (limit.min !== null && current < limit.min) {
                value = limit.min;
            } else if (limit.max !== null && limit.max < current) {
                value = limit.max;
            }

            return value;
        },

        /**
         * 根据限制值修正矩形的所有边
         * @param {Object} rect - 包含新位置的矩形对象
         * @returns {Object} 修正后的矩形位置
         */
        rectCorrectionByLimit(rect) {
            const { limits } = this;
            let { newRight, newLeft, newBottom, newTop } = rect;

            newLeft = this.sideCorrectionByLimit(limits.left, newLeft);
            newRight = this.sideCorrectionByLimit(limits.right, newRight);
            newTop = this.sideCorrectionByLimit(limits.top, newTop);
            newBottom = this.sideCorrectionByLimit(limits.bottom, newBottom);

            return {
                newLeft,
                newRight,
                newTop,
                newBottom,
            };
        },

        /**
         * 根据宽高比例修正矩形位置
         * @param {Object} rect - 包含新位置的矩形对象
         * @returns {Object} 修正后的矩形位置
         */
        rectCorrectionByAspectRatio(rect) {
            let { newLeft, newRight, newTop, newBottom } = rect;
            const { parentWidth, parentHeight, currentStick, aspectFactor, dimensionsBeforeMove } = this;

            let newWidth = parentWidth - newLeft - newRight;
            let newHeight = parentHeight - newTop - newBottom;

            // 处理中间手柄的特殊情况
            if (currentStick[1] === 'm') {
                // 垂直调整时保持宽高比
                const deltaHeight = newHeight - dimensionsBeforeMove.height;
                newLeft -= (deltaHeight * aspectFactor) / 2;
                newRight -= (deltaHeight * aspectFactor) / 2;
            } else if (currentStick[0] === 'm') {
                // 水平调整时保持宽高比
                const deltaWidth = newWidth - dimensionsBeforeMove.width;
                newTop -= (deltaWidth / aspectFactor) / 2;
                newBottom -= (deltaWidth / aspectFactor) / 2;
            } else if (newWidth / newHeight > aspectFactor) {
                // 调整宽度以匹配宽高比
                newWidth = aspectFactor * newHeight;

                if (currentStick[1] === 'l') {
                    newLeft = parentWidth - newRight - newWidth;
                } else {
                    newRight = parentWidth - newLeft - newWidth;
                }
            } else {
                // 调整高度以匹配宽高比
                newHeight = newWidth / aspectFactor;

                if (currentStick[0] === 't') {
                    newTop = parentHeight - newBottom - newHeight;
                } else {
                    newBottom = parentHeight - newTop - newHeight;
                }
            }

            return { newLeft, newRight, newTop, newBottom };
        },
    },

    // 计算属性
    computed: {
        /**
         * 计算组件的位置样式
         * @returns {Object} CSS样式对象
         */
        positionStyle() {
            return {
                top: this.top + 'px',
                left: this.left + 'px',
                zIndex: this.zIndex,
            };
        },

        /**
         * 计算组件的尺寸样式
         * @returns {Object} CSS样式对象
         */
        sizeStyle() {
            return {
                width: this.w == 'auto' ? 'auto' : this.width + 'px',
                height: this.h == 'auto' ? 'auto' : this.height + 'px'
            };
        },

        /**
         * 计算调整手柄的样式
         * @returns {Function} 返回一个函数，用于计算特定手柄的样式
         */
        vdrStick() {
            return (stick) => {
                const stickStyle = {
                    width: `${this.stickSize / this.parentScaleX}px`,
                    height: `${this.stickSize / this.parentScaleY}px`,
                };
                stickStyle[styleMapping.y[stick[0]]] = `${this.stickSize / this.parentScaleX / -2}px`;
                stickStyle[styleMapping.x[stick[1]]] = `${this.stickSize / this.parentScaleX / -2}px`;
                return stickStyle;
            };
        },

        /**
         * 计算组件当前宽度
         * @returns {number} 组件宽度
         */
        width() {
            return this.parentWidth - this.left - this.right;
        },

        /**
         * 计算组件当前高度
         * @returns {number} 组件高度
         */
        height() {
            return this.parentHeight - this.top - this.bottom;
        },

        /**
         * 获取组件的位置和尺寸信息
         * @returns {Object} 包含位置和尺寸的对象
         */
        rect() {
            return {
                left: Math.round(this.left),
                top: Math.round(this.top),
                width: Math.round(this.width),
                height: Math.round(this.height),
            };
        },
    },

    // 属性监听器
    watch: {
        /**
         * 监听激活状态变化
         * @param {boolean} isActive - 是否激活
         */
        active(isActive) {
            if (isActive) {
                this.$emit('activated');
            } else {
                this.$emit('deactivated');
            }
        },

        /**
         * 监听isActive属性变化
         * 立即执行一次，在后续变化时更新组件激活状态
         */
        isActive: {
            immediate: true,
            handler(val) {
                this.active = val;
            },
        },

        /**
         * 监听z-index变化
         * 立即执行一次，确保z-index值有效
         */
        z: {
            immediate: true,
            handler(val) {
                if (val >= 0 || val === 'auto') {
                    this.zIndex = val;
                }
            },
        },

        /**
         * 监听x坐标变化
         * 当组件不在拖动状态时，通过模拟拖动来更新位置
         * @param {number} newVal - 新的x坐标
         * @param {number} oldVal - 旧的x坐标
         */
        x: {
            handler(newVal, oldVal) {
                if (this.stickDrag || this.bodyDrag || (newVal === this.left)) {
                    return;
                }

                const delta = oldVal - newVal;

                this.bodyDown({ pageX: this.left, pageY: this.top });
                this.bodyMove({ x: delta, y: 0 });

                this.$nextTick(() => {
                    this.bodyUp();
                });
            },
        },

        /**
         * 监听y坐标变化
         * 当组件不在拖动状态时，通过模拟拖动来更新位置
         * @param {number} newVal - 新的y坐标
         * @param {number} oldVal - 旧的y坐标
         */
        y: {
            handler(newVal, oldVal) {
                if (this.stickDrag || this.bodyDrag || (newVal === this.top)) {
                    return;
                }

                const delta = oldVal - newVal;

                this.bodyDown({ pageX: this.left, pageY: this.top });
                this.bodyMove({ x: 0, y: delta });

                this.$nextTick(() => {
                    this.bodyUp();
                });
            },
        },

        /**
         * 监听宽度变化
         * 当组件不在调整大小状态时，通过模拟手柄拖动来更新宽度
         * @param {number|string} newVal - 新的宽度值
         * @param {number|string} oldVal - 旧的宽度值
         */
        w: {
            handler(newVal, oldVal) {
                if (this.stickDrag || this.bodyDrag || (newVal === this.width)) {
                    return;
                }

                const stick = 'mr';  // 使用右中手柄
                const delta = oldVal - newVal;

                this.stickDown(stick, { pageX: this.right, pageY: this.top + (this.height / 2) }, true);
                this.stickMove({ x: delta, y: 0 });

                this.$nextTick(() => {
                    this.stickUp();
                });
            },
        },

        /**
         * 监听高度变化
         * 当组件不在调整大小状态时，通过模拟手柄拖动来更新高度
         * @param {number|string} newVal - 新的高度值
         * @param {number|string} oldVal - 旧的高度值
         */
        h: {
            handler(newVal, oldVal) {
                if (this.stickDrag || this.bodyDrag || (newVal === this.height)) {
                    return;
                }

                const stick = 'bm';  // 使用底部中间手柄
                const delta = oldVal - newVal;

                this.stickDown(stick, { pageX: this.left + (this.width / 2), pageY: this.bottom }, true);
                this.stickMove({ x: 0, y: delta });

                this.$nextTick(() => {
                    this.stickUp();
                });
            },
        },

        /**
         * 监听父容器宽度变化
         * 更新组件的右侧位置和父容器宽度
         * @param {number} val - 新的父容器宽度
         */
        parentW(val) {
            this.right = val - this.width - this.left;
            this.parentWidth = val;
        },

        /**
         * 监听父容器高度变化
         * 更新组件的底部位置和��容器高度
         * @param {number} val - 新的父容器高度
         */
        parentH(val) {
            this.bottom = val - this.height - this.top;
            this.parentHeight = val;
        },
    },
};
