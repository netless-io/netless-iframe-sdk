import React from "react";
import { Typography, Button, Layout, Row, Col, Card, Collapse, Input, message } from "antd";
import { NetlessIframeSDK, Events } from "../dist/index";

const { Title } = Typography;
const { Content } = Layout;
const { Panel } = Collapse;

type AppState = {
    page: number;
    attributes: any;
    roomState: any;
    eventName: string;
    eventBody: string;
};

export class App extends React.Component<{}, AppState> {
    private sdk: NetlessIframeSDK;

    private constructor(props: any) {
        super(props);
        this.sdk = new NetlessIframeSDK();
    }

    public componentDidMount(): void {
        this.sdk.on(Events.initAttributes, attr => {
            this.setState({ attributes: attr, page: attr.currentPage });
        });
        this.sdk.on(Events.attributesUpdate, attr => {
            this.setState({ attributes: attr });
        });

        this.sdk.on(Events.onRoomStateChanged, roomState => {
            this.setState({ roomState: roomState });
        });
        const nextPageListener = () => {
            this.setState({ page: this.state.page + 1 });
        };
        const prevPageListener = () => {
            this.setState({ page: this.state.page - 1 });
        };
        this.sdk.addMagixEventListener("nextPage", nextPageListener);
        this.sdk.addMagixEventListener("prevPage", prevPageListener);
    }

    public componentWillUnmount(): void {
        console.log("componentWillUnmount");
    }

    private nextPage = () => {
        this.setState({ page: this.state.page + 1 });
        this.sdk.nextPage();
    }

    private prevPage = () => {
        this.setState({ page: this.state.page - 1 });
        this.sdk.prevPage();
    }

    private sendMagixEvent = () => {
        const { eventName, eventBody } = this.state;
        if (eventName && eventBody) {
            try {
                const body = JSON.parse(eventBody);
                this.sdk.dispatchMagixEvent(eventName, body);
            } catch (error) {
                message.error("事件体必须为合法的 JSON");
            }
        }
    }

    public render(): React.ReactNode  {
        return (
            <Layout style={{ height: "100vh", width: "100vw", padding: "50px" }}>
                <Layout>
                    <Content>
                        <Row style={{ paddingBottom: "20px" }}>
                            <Col offset={6}>
                                <Card>{this.state && JSON.stringify(this.state.attributes)}</Card>
                                <Collapse defaultActiveKey={["1"]}>
                                    <Panel header="room state" key="1">
                                        <p style={{width: "50vw", wordBreak: "break-word"}}>{this.state && JSON.stringify(this.state.roomState)}</p>
                                    </Panel>
                                </Collapse>
                            </Col>
                        </Row>
                        <Row style={{ paddingBottom: "20px" }}>
                            <Col offset={6}>
                                <Card>Page {this.state && this.state.page}</Card>
                            </Col>
                        </Row>
                        <Row style={{ paddingBottom: "20px" }}>
                            <Col offset={6}>
                                <Button onClick={this.prevPage}>上一页</Button>
                                <Button onClick={this.nextPage}>下一页</Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col offset={6}>
                                <Input placeholder="事件名" onChange={e => this.setState({ eventName: e.target.value })}/>
                                <Input placeholder="事件体" onChange={e => this.setState({ eventBody: e.target.value })}/>
                                <Button onClick={this.sendMagixEvent}>发送自定义事件</Button>
                            </Col>
                        </Row>
                    </Content>
                </Layout>
            </Layout>
        );
    }
}
