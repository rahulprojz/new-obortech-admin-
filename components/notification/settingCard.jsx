import React from 'react';
import string from "../../utils/LanguageTranslation.js";

function SettingCard(props){
  const component=props.component;
    return(

        <div className="setting-content">
                      <h6>{string.byDoctypes}</h6>
                      <div className="setting-card setting-content-wrap">
                        <div className="chekbox-wrap">
                          <div className="custom-checkbox">
                            <Checkbox
                              value="Mongolia-Australia 1-3"
                              id="MongoliaAustralia"
                              className="notification-check custom-control-input" checked/>
                              <label className="custom-control-label" for="MongoliaAustralia">{string.mongolia}</label>
                          </div>
                          <div className="custom-checkbox">
                            <Checkbox
                              value="China-Mongolia KYL 1-2"
                              id="ChinaMongoliaKYL"
                              className="notification-check custom-control-input" checked/>
                              <label className="custom-control-label" for="ChinaMongoliaKYL">{string.chinaMongolia}</label>
                          </div>
                          <div className="custom-checkbox">
                            <Checkbox
                              value="UBCHPRE 1-2"
                              id="UBCHPRE"
                              className="notification-check custom-control-input" checked/>
                              <label className="custom-control-label" for="UBCHPRE">{string.ubchpre}</label>
                          </div>
                          <div className="custom-checkbox">
                            <Checkbox
                              value="UBMN-ENCN PRE-12"
                              id="UBMNENCNPRE"
                              className="notification-check custom-control-input" />
                              <label className="custom-control-label" for="UBMNENCNPRE">{string.ubmnencn}</label>
                          </div>
                        </div>
                      </div>
                    </div>
    )
};
export default SettingCard;
