import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { reduxForm, Field, FieldArray } from 'redux-form';
import { updateCommunicationSla } from '../../actions/incidentCommunicationSla';
import { closeModal } from '../../actions/modal';
import ShouldRender from '../basic/ShouldRender';
import { FormLoader } from '../basic/Loader';
import { RenderField } from '../basic/RenderField';
import { RenderSelect } from '../basic/RenderSelect';

function validate(values) {
    const errors = {};

    if (!values.name) {
        errors.name = 'Communication SLA name is required';
    }
    return errors;
}

class EditIncidentCommunicationSlaModal extends React.Component {
    state = {
        monitorError: null,
    };

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    submitForm = values => {
        const {
            closeModal,
            editIncidentSlaModalId,
            currentProject,
            monitors,
            slaError,
            initialValues,
            updateCommunicationSla,
        } = this.props;
        const projectId = currentProject._id;
        const incidentSlaId = initialValues._id;
        const postObj = {};

        if (values.monitors && values.monitors.length > 0) {
            const monitors = values.monitors.filter(
                monitorId => typeof monitorId === 'string'
            );
            postObj.monitors = monitors;
        } else {
            postObj.monitors = monitors.map(monitor => monitor._id);
        }

        postObj.name = values.name;
        postObj.duration = values.duration;
        postObj.isDefault = values.isDefault;

        const isDuplicate = postObj.monitors
            ? postObj.monitors.length === new Set(postObj.monitors).size
                ? false
                : true
            : false;

        if (isDuplicate) {
            this.setState({
                monitorError: 'Duplicate monitor selection found',
            });
            return;
        }

        if (
            postObj.monitors &&
            postObj.monitors.length === 0 &&
            !values.selectAllMonitors
        ) {
            this.setState({
                monitorError: 'No monitor was selected',
            });
            return;
        }

        updateCommunicationSla(projectId, incidentSlaId, postObj).then(() => {
            if (!slaError) {
                closeModal({
                    id: editIncidentSlaModalId,
                });
            }
        });
    };

    handleKeyBoard = e => {
        switch (e.key) {
            case 'Escape':
                return this.props.closeModal({
                    id: this.props.editIncidentSlaModalId,
                });
            case 'Enter':
                return document.getElementById('createSlaBtn').click();
            default:
                return false;
        }
    };

    renderMonitors = ({ fields }) => {
        const { monitorError } = this.state;
        const { formValues } = this.props;
        return (
            <>
                {formValues && formValues.selectAllMonitors && (
                    <div
                        className="bs-Fieldset-row"
                        style={{ padding: 0, width: '100%' }}
                    >
                        <div
                            className="bs-Fieldset-fields bs-Fieldset-fields--wide"
                            style={{ padding: 0 }}
                        >
                            <div
                                className="Box-root"
                                style={{
                                    height: '5px',
                                }}
                            ></div>
                            <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                <label
                                    className="Checkbox"
                                    htmlFor="selectAllMonitorsBox"
                                >
                                    <Field
                                        component="input"
                                        type="checkbox"
                                        name="selectAllMonitors"
                                        className="Checkbox-source"
                                        id="selectAllMonitorsBox"
                                    />
                                    <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                        <div className="Checkbox-target Box-root">
                                            <div className="Checkbox-color Box-root"></div>
                                        </div>
                                    </div>
                                    <div className="Checkbox-label Box-root Margin-left--8">
                                        <span className="Text-color--default Text-display--inline Text-fontSize--14 Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                            <span>All Monitors Selected</span>
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
                {formValues && !formValues.selectAllMonitors && (
                    <div
                        style={{
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        <button
                            id="addMoreMonitor"
                            className="Button bs-ButtonLegacy ActionIconParent"
                            style={{
                                position: 'absolute',
                                zIndex: 1,
                                right: 0,
                            }}
                            type="button"
                            onClick={() => {
                                fields.push();
                            }}
                        >
                            <span className="bs-Button bs-FileUploadButton bs-Button--icon bs-Button--new">
                                <span>Add Monitor</span>
                            </span>
                        </button>
                        {fields.length === 0 && !formValues.selectAllMonitors && (
                            <div
                                className="bs-Fieldset-row"
                                style={{ padding: 0, width: '100%' }}
                            >
                                <div
                                    className="bs-Fieldset-fields bs-Fieldset-fields--wide"
                                    style={{ padding: 0 }}
                                >
                                    <div
                                        className="Box-root"
                                        style={{
                                            height: '5px',
                                        }}
                                    ></div>
                                    <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                        <label
                                            className="Checkbox"
                                            htmlFor="selectAllMonitorsBox"
                                        >
                                            <Field
                                                component="input"
                                                type="checkbox"
                                                name="selectAllMonitors"
                                                className="Checkbox-source"
                                                id="selectAllMonitorsBox"
                                            />
                                            <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                                <div className="Checkbox-target Box-root">
                                                    <div className="Checkbox-color Box-root"></div>
                                                </div>
                                            </div>
                                            <div className="Checkbox-label Box-root Margin-left--8">
                                                <span className="Text-color--default Text-display--inline Text-fontSize--14 Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                    <span>
                                                        Select All Monitors
                                                    </span>
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                        {fields.map((field, index) => {
                            return (
                                <div
                                    style={{
                                        width: '65%',
                                        marginBottom: 10,
                                    }}
                                    key={index}
                                >
                                    <Field
                                        className="db-select-nw Table-cell--width--maximized"
                                        component={RenderSelect}
                                        name={field}
                                        id={`monitorfield_${index}`}
                                        placeholder="Monitor"
                                        style={{
                                            height: '28px',
                                            width: '100%',
                                        }}
                                        options={[
                                            {
                                                value: '',
                                                label: 'Select a Monitor',
                                            },
                                            ...(this.props.monitors &&
                                            this.props.monitors.length > 0
                                                ? this.props.monitors.map(
                                                      monitor => ({
                                                          value: monitor._id,
                                                          label: `${monitor.componentId.name} / ${monitor.name}`,
                                                      })
                                                  )
                                                : []),
                                        ]}
                                    />
                                    <button
                                        id="addMoreMonitor"
                                        className="Button bs-ButtonLegacy ActionIconParent"
                                        style={{
                                            marginTop: 10,
                                        }}
                                        type="button"
                                        onClick={() => {
                                            fields.remove(index);
                                        }}
                                    >
                                        <span className="bs-Button bs-Button--icon bs-Button--delete">
                                            <span>Remove Monitor</span>
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                        {monitorError && (
                            <div
                                className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                style={{
                                    marginTop: '5px',
                                    alignItems: 'center',
                                }}
                            >
                                <div
                                    className="Box-root Margin-right--8"
                                    style={{ marginTop: '2px' }}
                                >
                                    <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                </div>
                                <div className="Box-root">
                                    <span
                                        id="monitorError"
                                        style={{ color: 'red' }}
                                    >
                                        {monitorError}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    };

    render() {
        const {
            requesting,
            slaError,
            closeModal,
            handleSubmit,
            editIncidentSlaModalId,
        } = this.props;

        return (
            <div
                className="ModalLayer-contents"
                tabIndex="-1"
                style={{ marginTop: '40px' }}
            >
                <div className="bs-BIM">
                    <div className="bs-Modal" style={{ width: 600 }}>
                        <div className="bs-Modal-header">
                            <div
                                className="bs-Modal-header-copy"
                                style={{
                                    marginBottom: '10px',
                                    marginTop: '10px',
                                }}
                            >
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>Edit Incident Communication SLA</span>
                                </span>
                            </div>
                        </div>
                        <form
                            id="communicationSlaForm"
                            onSubmit={handleSubmit(this.submitForm)}
                        >
                            <div className="bs-Modal-content">
                                <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                    <fieldset className="Margin-bottom--16">
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="endpoint"
                                                >
                                                    <span>SLA Name</span>
                                                </label>
                                                <div className="bs-Fieldset-fields">
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Field
                                                            component={
                                                                RenderField
                                                            }
                                                            name="name"
                                                            placeholder="SLA name"
                                                            id="name"
                                                            className="bs-TextInput"
                                                            style={{
                                                                width: '100%',
                                                                padding:
                                                                    '3px 5px',
                                                            }}
                                                            autoFocus={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                    <fieldset className="Margin-bottom--16">
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="endpoint"
                                                >
                                                    <span>Monitors</span>
                                                </label>
                                                <div className="bs-Fieldset-fields">
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <FieldArray
                                                            name="monitors"
                                                            component={
                                                                this
                                                                    .renderMonitors
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                    <fieldset className="Margin-bottom--16">
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="monitorIds"
                                                >
                                                    <span>
                                                        Duration (minutes)
                                                    </span>
                                                </label>
                                                <div className="bs-Fieldset-fields">
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Field
                                                            component={
                                                                RenderField
                                                            }
                                                            name="duration"
                                                            placeholder="60"
                                                            id="duration"
                                                            className="bs-TextInput"
                                                            style={{
                                                                width: '100%',
                                                                padding:
                                                                    '3px 5px',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                    <div className="bs-Fieldset-row">
                                        <label className="bs-Fieldset-label">
                                            <span></span>
                                        </label>
                                        <div className="bs-Fieldset-fields bs-Fieldset-fields--wide">
                                            <div
                                                className="Box-root"
                                                style={{
                                                    height: '5px',
                                                }}
                                            ></div>
                                            <div className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--column Flex-justifyContent--flexStart">
                                                <label
                                                    className="Checkbox"
                                                    htmlFor="isDefault"
                                                >
                                                    <Field
                                                        component="input"
                                                        type="checkbox"
                                                        name="isDefault"
                                                        className="Checkbox-source"
                                                        id="isDefault"
                                                    />
                                                    <div className="Checkbox-box Box-root Margin-top--2 Margin-right--2">
                                                        <div className="Checkbox-target Box-root">
                                                            <div className="Checkbox-color Box-root"></div>
                                                        </div>
                                                    </div>
                                                    <div className="Checkbox-label Box-root Margin-left--8">
                                                        <span className="Text-color--default Text-display--inline Text-fontSize--14 Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                            <span>
                                                                Set as Default
                                                            </span>
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bs-Modal-footer">
                                <div className="bs-Modal-footer-actions">
                                    <ShouldRender if={slaError}>
                                        <div
                                            className="bs-Tail-copy"
                                            style={{ width: 200 }}
                                        >
                                            <div
                                                className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                                style={{ marginTop: '10px' }}
                                            >
                                                <div className="Box-root Margin-right--8">
                                                    <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                                </div>
                                                <div className="Box-root">
                                                    <span
                                                        style={{ color: 'red' }}
                                                    >
                                                        {slaError}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </ShouldRender>
                                    <button
                                        className="bs-Button bs-DeprecatedButton btn__modal"
                                        type="button"
                                        onClick={() =>
                                            closeModal({
                                                id: editIncidentSlaModalId,
                                            })
                                        }
                                    >
                                        <span>Cancel</span>
                                        <span className="cancel-btn__keycode">
                                            Esc
                                        </span>
                                    </button>
                                    <button
                                        id="editSlaBtn"
                                        className="bs-Button bs-DeprecatedButton bs-Button--blue btn__modal"
                                        disabled={requesting}
                                        type="submit"
                                    >
                                        {!requesting && (
                                            <>
                                                <span>Update</span>
                                                <span className="create-btn__keycode">
                                                    <span className="keycode__icon keycode__icon--enter" />
                                                </span>
                                            </>
                                        )}
                                        {requesting && <FormLoader />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

EditIncidentCommunicationSlaModal.displayName =
    'EditIncidentCommunicationSlaModal';

EditIncidentCommunicationSlaModal.propTypes = {
    closeModal: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    requesting: PropTypes.bool,
    slaError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    monitors: PropTypes.array,
    formValues: PropTypes.object,
    updateCommunicationSla: PropTypes.func,
    currentProject: PropTypes.object,
    initialValues: PropTypes.object,
    editIncidentSlaModalId: PropTypes.string,
};

const EditIncidentSlaForm = reduxForm({
    form: 'editIncidentSlaForm',
    enableReinitialize: false,
    validate,
    destroyOnUnmount: true,
})(EditIncidentCommunicationSlaModal);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            closeModal,
            updateCommunicationSla,
        },
        dispatch
    );

const mapStateToProps = state => {
    const incidentSlaToBeUpdated = state.modal.modals[0].sla;

    const monitorData = state.monitor.monitorsList.monitors.find(
        data => String(data._id) === String(state.modal.modals[0].projectId)
    );
    const monitors = monitorData.monitors;

    const initialValues = {};

    const monitorIds =
        monitors.length !== incidentSlaToBeUpdated.monitors.length
            ? incidentSlaToBeUpdated
                ? incidentSlaToBeUpdated.monitors.map(
                      monitor => monitor.monitorId._id
                  )
                : []
            : [];

    if (incidentSlaToBeUpdated) {
        initialValues.name = incidentSlaToBeUpdated.name;
        initialValues.isDefault = incidentSlaToBeUpdated.isDefault;
        initialValues.duration = incidentSlaToBeUpdated.duration;
        initialValues._id = incidentSlaToBeUpdated._id;
        initialValues.selectAllMonitors =
            monitors.length === incidentSlaToBeUpdated.monitors.length
                ? true
                : false;
        initialValues.monitors = [...monitorIds];
    }

    return {
        editIncidentSlaModalId: state.modal.modals[0].id,
        monitors,
        initialValues,
        formValues:
            state.form.editIncidentSlaForm &&
            state.form.editIncidentSlaForm.values,
        requesting: state.incidentSla.incidentCommunicationSlas.requesting,
        slaError: state.incidentSla.incidentCommunicationSlas.error,
        currentProject: state.project.currentProject,
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EditIncidentSlaForm);
