import React, {Component} from 'react';
import {Table, Button, Collapse} from 'antd';
import {getUserWorkVideoPath, getUserWorkWebsitePath} from '../../../utils/urlBuilder';
import {Link} from 'react-router-dom';
import {getTasks, updateTask, activateUser, getProfile} from '../../../services/session/authorization';
import YoutubePlayer from '../../../components/youtube-player/YoutubePlayer';

import * as _ from 'lodash';

const {Panel} = Collapse;
const {Column, ColumnGroup} = Table;

export default class Work extends Component {

    async onActivateUser(){
        const res = await activateUser(this.state.user);
        if (!res) return;
        this.setState({
            user: {...this.state.user, ...{ status: 1 }}
        });
    }

    constructor() {
        super();

        this.state = {
            data: [],
            activeKey: '0',
            loading: false,
            user: {},
            loaded: false,
            pagination: {
                pageSize: 5,
                defaultCurrent: 1,
                onChange: (page) => {
                    this.updateTable(page);
                }
            },
            videoUrl: '',
        }

        this.selectedVideo = {};
    }

    componentDidMount() {
        this.updateTable(this.state.pagination.defaultCurrent);
        this.fetchUser();
    }

    async updateTable(page) {
        const params = {
            limit: this.state.pagination.pageSize,
            offset: (page - 1) * this.state.pagination.pageSize
        }

        this.setState({
            loading: true
        });

        const res = await getTasks(params);

        if (!res) {
            this.setState({
                data: [],
                loading: false
            });
            return;
        }

        this.setState({
            data: res.results,
            activeKey: '1',
            loading: false,
            pagination: { ...this.state.pagination, ...{ total: res.count } }
        });
    }

    async fetchUser() {
        const res = await getProfile();
        this.setState({ 
            user: res.data,
            loaded: true
        });
    }

    onCollapseChange(key) {
        this.setState({
            activeKey: this.state.activeKey === '0' ? '1' : '0'
        });
    }

    openPlayer(item) {
        if (item.status === 0) {
            return;
        }
        this.selectedVideo = item;
        const videoUrl = item.link;
        this.setState({
            videoUrl
        });
    }

    async onClose(duration) {
        this.setState({
            videoUrl: ''
        });
        if (duration >= 20) {
            const video = _.cloneDeep(this.selectedVideo);
            video.status = 0;
            
            this.setState({
                loading: true
            });

            const res = await updateTask(video);
            if (res) {
                this.selectedVideo.status = 0;
            }

            this.setState({
                loading: false
            });
        }
    }

    render() {
        let footer = null;

        if (this.state.user.status === 0 && this.state.loaded) {
            footer = (
                <div>
                    <h2 className="mt-4 ml-3 fs-3">To view more ads, please <Button onClick={this.onActivateUser.bind(this)} type="primary" size="large" className="ml-1">Activate</Button> your account.</h2>
                    <h3 className="mt-3">* You will be charged $30 from your account balance to activate your account.</h3>
                    <h3>* Your account will remain active for 90 days since the day of activation.</h3>
                </div>
            );
        }

        return (
            <div className="user-admin-work">
                <h2 className="text-left">Work</h2>
                <Link to={getUserWorkWebsitePath()}><Button type="primary" size="large" className="mr-1">Browse Website</Button></Link>
                <Link to={getUserWorkVideoPath()}><Button type="primary" size="large" className="ml-1">Watch Videos</Button></Link>

                <div className="mt-3">
                    <Collapse accordion activeKey={this.state.activeKey} onChange={this.onCollapseChange.bind(this)}>
                        <Panel header="Available tasks" key="1">
                            <Table pagination={this.state.pagination} loading={this.state.loading} dataSource={this.state.data} rowKey="id">
                                <Column
                                    title="#"
                                    key="index"
                                    render={(text, record, index) => index + 1}
                                />
                                <Column
                                    title="TVC Name"
                                    dataIndex="name"
                                    key="name"
                                />
                                <Column
                                    title="Reward amount"
                                    dataIndex="reward"
                                    key="reward"
                                    render={(text) => `$${text}`}
                                />
                                <Column
                                    title="Watch"
                                    key="btn"
                                    render={(text, record) => record.kind === 1 ? (
                                        <Button 
                                            type="primary" 
                                            href={record.link} 
                                            target="_blank">
                                            Visit
                                        </Button>
                                    ) : (
                                        <Button
                                            type="primary"
                                            onClick={() => this.openPlayer(record)}
                                            disabled={record.status === 0}>
                                            {record.status === 0? 'Watched' : 'Watch'}
                                        </Button>
                                    )}
                                />
                            </Table>
                        </Panel>
                    </Collapse>
                </div>
                <YoutubePlayer
                    url={this.state.videoUrl}
                    onClose={this.onClose.bind(this)}/>

                {footer}
            </div>
        );
    }
}
