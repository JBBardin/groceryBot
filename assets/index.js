var ingredientListing = [];

fetch(process.env.BASE_URL + "/ingredient/listing")
    .then(response => response.json())
    .then(data => ingredientListing = data.sort((a, b) => a.kind - b.kind));

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            listnames: [],
            currentListe: {
                name: "default",
                items: []
            }
        };
        this.displayGroceryList = this.displayGroceryList.bind(this);
        this.itemHandler = this.itemUpdateHandler.bind(this);
        this.listHndler = this.listUpdateHandler.bind(this);
    }

    displayGroceryList(list) {
        console.log("fetching list named ", list.key)
        fetch(process.env.BASE_URL + "/list/" + list.key)
            .then(response => response.json())
            .then(items => this.setState({
                currentListe: {
                    name: list.key,
                    items: items
                }
            }));
    }

    itemUpdateHandler(item) {
        if (item.is_deleted) {
            fetch(process.env.BASE_URL + "/list/" + this.state.currentListe.name + "/items/" + item.name,
                { method: "DELETE" })
                .then(response => response.json())
                .then(items => this.setState({
                    currentListe: {
                        name: this.state.currentListe.name,
                        items: items
                    }
                }));
        } else if (item.is_created) {
            fetch(process.env.BASE_URL + "/list/" + this.state.currentListe.name + "/items",
                { method: "POST", body: JSON.stringify(item), headers: { "Content-Type": "application/json" } })
                .then(response => response.json())
                .then(items => this.setState({
                    currentListe: {
                        name: this.state.currentListe.name,
                        items: items
                    }
                }));
        } else {
            fetch(process.env.BASE_URL + "/list/" + this.state.currentListe.name + "/items",
                { method: "PUT", body: JSON.stringify(item), headers: { "Content-Type": "application/json" } })
                .then(response => response.json())
                .then(items => this.setState({
                    currentListe: {
                        name: this.state.currentListe.name,
                        items: items
                    }
                }));
        }
    }

    listUpdateHandler(list) {
        if (list.is_deleted) {
            // TODO fix bug after deleteing a liste ((we tried to get the list items again))
            fetch(process.env.BASE_URL + "/list/" + list.name, { method: "DELETE" })
                .then(response => response.json())
                .then(listnames => {
                    this.setState({ listnames: listnames });
                    this.displayGroceryList({ key: listnames[0] });
                });
        } else if (list.is_created) {
            fetch(process.env.BASE_URL + "/list", { method: "POST", body: JSON.stringify(list), headers: { "Content-Type": "application/json" } })
                .then(response => response.json())
                .then(listnames => {
                    this.setState({ listnames });
                });
        }
    }

    componentDidMount() {
        fetch(process.env.BASE_URL + "/list/names")
            .then(response => response.json())
            .then(listnames => {
                this.setState({ listnames });
                this.displayGroceryList({ key: listnames[0] })
            });
    }

    render() {
        return (
            <div className="App col-xs-12" >
                <antd.Layout className="site-layout">
                    <antd.Layout.Sider width="25%" style={{ padding: "5px" }}>
                        <h2>Nom des listes</h2>
                        <antd.Menu mode="inline" defaultSelectedKeys={this.state.currentListe.name} onClick={this.displayGroceryList}>
                            {
                                this.state.listnames.map(n => { return <antd.Menu.Item key={n} ><span className="list-label">{n}</span><DeleteListButton list={n} handler={this.listHndler} /></antd.Menu.Item> })
                            }
                        </antd.Menu>
                        <h2 style={{ marginTop: "5%" }}>Créer une liste</h2>
                        <ListForm listnames={this.state.listnames} onFinish={this.listHndler}></ListForm>
                    </antd.Layout.Sider>
                    <antd.Layout.Content>
                        <h1>Liste de course: {this.state.currentListe.name}</h1>
                        <div style={{ margin: '10px' }}>
                            <AddIngredientButton handler={this.itemHandler} />
                            <RefreshButton handler={this.itemHandler} items={this.state.currentListe.items} />
                        </div>
                        <IngredientsCollapse list={this.state.currentListe} handler={this.itemHandler}></IngredientsCollapse>
                    </antd.Layout.Content>
                </antd.Layout>
            </div >
        )
    }
}

class IngredientsCollapse extends React.Component {

    getHeader(key) {
        return ingredientListing.find(ing => ing.name == key).label
    }

    render() {
        return (
            <antd.Collapse activeKey={Object.keys(this.props.list.items)}>
                {
                    Object.keys(this.props.list.items).map(key => {
                        return <antd.Collapse.Panel header={this.getHeader(key)} key={key} showArrow={false}>
                            <RefreshButton handler={this.props.handler} items={this.props.list.items[key].sort((a, b) => a.is_bought - b.is_bought)} />
                            <IngredientsList key={key} dataSource={this.props.list.items[key]} handler={this.props.handler} />
                        </antd.Collapse.Panel>
                    })
                }
            </antd.Collapse>
        )
    }
}

class BoughtButton extends React.Component {
    handler = (item) => {
        item.is_bought = true;
        this.props.handler(item);
    }

    render() {
        return (
            <antd.Button key="list-bought" className="ok-btn" onClick={() => this.handler(this.props.item)}>
                <svg viewBox="0 0 1024 1024" focusable="false" data-icon="shopping-cart" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M922.9 701.9H327.4l29.9-60.9 496.8-.9c16.8 0 31.2-12 34.2-28.6l68.8-385.1c1.8-10.1-.9-20.5-7.5-28.4a34.99 34.99 0 0 0-26.6-12.5l-632-2.1-5.4-25.4c-3.4-16.2-18-28-34.6-28H96.5a35.3 35.3 0 1 0 0 70.6h125.9L246 312.8l58.1 281.3-74.8 122.1a34.96 34.96 0 0 0-3 36.8c6 11.9 18.1 19.4 31.5 19.4h62.8a102.43 102.43 0 0 0-20.6 61.7c0 56.6 46 102.6 102.6 102.6s102.6-46 102.6-102.6c0-22.3-7.4-44-20.6-61.7h161.1a102.43 102.43 0 0 0-20.6 61.7c0 56.6 46 102.6 102.6 102.6s102.6-46 102.6-102.6c0-22.3-7.4-44-20.6-61.7H923c19.4 0 35.3-15.8 35.3-35.3a35.42 35.42 0 0 0-35.4-35.2zM305.7 253l575.8 1.9-56.4 315.8-452.3.8L305.7 253zm96.9 612.7c-17.4 0-31.6-14.2-31.6-31.6 0-17.4 14.2-31.6 31.6-31.6s31.6 14.2 31.6 31.6a31.6 31.6 0 0 1-31.6 31.6zm325.1 0c-17.4 0-31.6-14.2-31.6-31.6 0-17.4 14.2-31.6 31.6-31.6s31.6 14.2 31.6 31.6a31.6 31.6 0 0 1-31.6 31.6z"></path></svg>
            </ antd.Button >
        )
    }
}

class RefreshButton extends React.Component {
    handler = (items) => {
        if (Array.isArray(items)) {
            items.map(item => {
                item.is_bought = false;
                this.props.handler(item);
            });
        } else {
            Object.keys(items).map(key => { this.handler(items[key]) });
        }
    }

    render() {
        return (
            <antd.Button key="list-refresh" className="refresh-btn" onClick={() => this.handler(this.props.items)}>
                <svg viewBox="64 64 896 896" focusable="false" data-icon="sync" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M168 504.2c1-43.7 10-86.1 26.9-126 17.3-41 42.1-77.7 73.7-109.4S337 212.3 378 195c42.4-17.9 87.4-27 133.9-27s91.5 9.1 133.8 27A341.5 341.5 0 01755 268.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.7 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c0-6.7-7.7-10.5-12.9-6.3l-56.4 44.1C765.8 155.1 646.2 92 511.8 92 282.7 92 96.3 275.6 92 503.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8zm756 7.8h-60c-4.4 0-7.9 3.5-8 7.8-1 43.7-10 86.1-26.9 126-17.3 41-42.1 77.8-73.7 109.4A342.45 342.45 0 01512.1 856a342.24 342.24 0 01-243.2-100.8c-9.9-9.9-19.2-20.4-27.8-31.4l60.2-47a8 8 0 00-3-14.1l-175.7-43c-5-1.2-9.9 2.6-9.9 7.7l-.7 181c0 6.7 7.7 10.5 12.9 6.3l56.4-44.1C258.2 868.9 377.8 932 512.2 932c229.2 0 415.5-183.7 419.8-411.8a8 8 0 00-8-8.2z"></path></svg>
            </ antd.Button >

        )
    }
}

class DeleteItemButton extends React.Component {
    handler = (item) => {
        item.is_deleted = true;
        this.props.handler(item);
    }

    render() {
        return (
            <antd.Button key="list-delete-edit" className="delete-btn" onClick={() => this.handler(this.props.item)}>
                <svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path></svg>
            </antd.Button>
        )
    }
}


class DeleteListButton extends React.Component {
    handler = () => {
        this.props.handler({ name: this.props.list, is_deleted: true });
    }

    render() {
        return (
            <antd.Button key="list-delete-edit" className="delete-btn" onClick={() => this.handler()}>
                <svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path></svg>
            </antd.Button>
        )
    }
}

class EditButton extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            isModalVisible: false
        }
    }

    handleSubmit = (item) => {
        this.props.handler(item);
        this.setState({ isModalVisible: false });
    };

    handleCancel = () => {
        this.setState({ isModalVisible: false })
    };

    showModal = () => {
        this.setState({ isModalVisible: true })
    };

    render() {
        return (
            <>
                <antd.Button key="list-edit" className="edit-btn" onClick={this.showModal}>
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="edit" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"></path></svg>
                </antd.Button>
                <EditModal title="Modifier un ingrédient" visible={this.state.isModalVisible} item={this.props.item} onCancel={this.handleCancel} onSubmit={this.handleSubmit}></EditModal>
            </>
        )
    }
}

class AddIngredientButton extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            isModalVisible: false
        }
    }

    handleSubmit = (item) => {
        item.is_created = true;
        this.props.handler(item);
        this.setState({ isModalVisible: false });
    };

    handleCancel = () => {
        this.setState({ isModalVisible: false })
    };

    showModal = () => {
        this.setState({ isModalVisible: true })
    };

    render() {
        return (
            <>
                <antd.Button key="add-btn" onClick={this.showModal} type="primary">
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><defs><style></style></defs><path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path><path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path></svg>
                    Ajouter
                </antd.Button>
                <EditModal title="Ajouter un ingrédient" visible={this.state.isModalVisible} onCancel={this.handleCancel} onSubmit={this.handleSubmit}></EditModal>
            </>
        )
    }
}

const EditModal = ({ title, visible, item, onCancel, onSubmit }) => {
    const [form] = antd.Form.useForm();

    form.setFieldsValue(item)

    const handleSubmit = () => {
        form.validateFields()
            .then((values) => {
                form.resetFields();
                onSubmit(values);
            });
    }

    return (
        <antd.Modal title={title} visible={visible} onCancel={onCancel}
            footer={[
                <antd.Button form="editForm" htmlType="submit" key="submit" type="primary" onClick={() => handleSubmit()}>
                    Valider
                </antd.Button>
            ]}
        >
            <antd.Form id="editForm" form={form}>
                <antd.Form.Item label="Ingrédient" name="name" rules={[{ required: true, message: "Donner le nom de l'ingrédient" }]} >
                    <antd.Input placeholder="farine" defaultValue={item ? item.name : ""} autoComplete="off" />
                </antd.Form.Item>
                <antd.Form.Item label="Quantité" name="quantity" >
                    <antd.Input placeholder="200" defaultValue={item ? item.quantity : ""} />
                </antd.Form.Item>
                <antd.Form.Item label="Unité" name="units" >
                    <antd.Input placeholder="g" defaultValue={item ? item.units : ""} />
                </antd.Form.Item>
                <antd.Form.Item name="kind" label="type">
                    <antd.Select
                        defaultValue={item ? item.kind : ingredientListing && ingredientListing[1] ? ingredientListing[1].value : ""} style={{ width: 240 }}
                    >
                        {
                            ingredientListing.map(type => <antd.Select.Option key={type.name} value={type.value}>{type.label}</antd.Select.Option>)
                        }
                    </antd.Select>
                </antd.Form.Item>
            </antd.Form>
        </antd.Modal>
    );
};


class IngredientsList extends React.Component {
    render() {
        return (
            <antd.List size="small" dataSource={this.props.dataSource} renderItem={
                item => (
                    item.is_bought ? <antd.List.Item key={item.name} className="disable-list-item" actions={[
                        <RefreshButton items={[item]} handler={this.props.handler} />,
                        <DeleteItemButton item={item} handler={this.props.handler} />]} >
                        {item.quantity ? item.name + ' : ' + item.quantity + ' ' + item.units : item.name}
                    </antd.List.Item> : <antd.List.Item key={item.name} className="list-item" actions={[
                        <BoughtButton item={item} handler={this.props.handler} />,
                        <EditButton item={item} handler={this.props.handler} />,
                        <DeleteItemButton item={item} handler={this.props.handler} />]} >
                        {item.quantity ? item.name + ' : ' + item.quantity + ' ' + item.units : item.name}
                    </antd.List.Item>

                )
            } />
        )
    }
}

class ListForm extends React.Component {
    constructor(props) {
        super(props)
        this.checkName = this.checkName.bind(this);
    }

    checkName(_, value) {
        console.log(value, this.props.listnames)
        if (this.props.listnames.some(item => value === item)) {
            return Promise.reject(new Error("Cette liste existe déjà"))
        }

        if (value) {
            return Promise.resolve()
        }

        return Promise.reject(new Error("Ne peut pas être vide"))
    }

    onFinish = (list) => {
        list.is_created = true
        this.props.onFinish(list);
    }

    render() {
        return (
            <antd.Form
                name="add_list_form"
                onFinish={this.onFinish}
                layout="inline"
            >
                <antd.Form.Item name="name" label="" rules={[{ validator: this.checkName, },]}                >
                    <antd.Input placeholder="Nom de la liste" />
                </antd.Form.Item>
                <antd.Form.Item>
                    <antd.Button type="primary" htmlType="submit">
                        <svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true"><defs><style></style></defs><path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path><path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path></svg>
                    </antd.Button>
                </antd.Form.Item>
            </antd.Form>
        )
    }
}

ReactDOM.render(
    <App></App>,
    document.getElementById("root")
);