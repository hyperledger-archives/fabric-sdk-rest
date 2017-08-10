#!/bin/bash -

# Setup
#
# 1. Update data sources
# 2. Run the server, with optional debug info to console
#
# E.g.,
# ./setup.sh -f ~/fabric-samples/first-network -s


# Copyright 2017 IBM All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


_show_help() {
    printf -- "Usage: setup.sh [OPTIONS]\n\n"
    printf -- "Options:\n"
    printf -- "-s Start server\n"
    printf -- "-d Set debug info on\n"
    printf -- "-u Update data sources\n"
    printf -- "-k Update keys\n"
    printf -- "-f Fabic network dir\n"
    printf -- "-a Run as Admin, not User1\n"
    exit 12
}

if [[ -z "$1" ]]; then
    _show_help
fi

while getopts :sdukf:ah opt; do
    case "$opt" in
        s)    start_server=true
              ;;
        d)    debug=true
              ;;
        u)    update_data_sources=true
              ;;
        k)    update_keys=true
              ;;
        f)    fabric_network_dir="$OPTARG"
              ;;
        a)    run_as_admin=true
              ;;
        h)    _show_help
              ;;
        '?')  printf -- "Invalid option $OPTARG. Try '-h' for help.\n" && exit 12
              ;;
    esac
done

shift $((OPTIND-1))

project_dir="$(cd "$( dirname "${BASH_SOURCE[0]}" )/../" && pwd)/fabric-sdk-rest"

# Update private key in datasources.json
if [[ -n $update_keys ]]; then
    cd "${fabric_network_dir}/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"
    privatekeyUser="$(ls *_sk)"
    cd "${fabric_network_dir}/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
    privatekeyAdmin="$(ls *_sk)"

    if [[ -n $debug ]]; then
        printf -- "Fabric network directory: ${fabric_network_dir}\n"
        printf -- "Private user key: $privatekeyUser\n"
        printf -- "Private admin key: $privatekeyAdmin\n"
    fi
fi

cd "${project_dir}/packages/fabric-rest/server"

if [[ -n $update_data_sources ]]; then
    # Use ^ for sed command as / is in file paths
    if [[ -n $run_as_admin ]]; then
        sed -e "s/ADMINUSER/fabricUser/" -e "s/XXXXXXXX/${privatekeyUser}/" -e "s/ADMIN1STORE/${privatekeyAdmin}/" \
            -e "s^FABSAMPLE^${fabric_network_dir}^" < datasources.json.template > datasources.json
    else
        sed -e "s/AUSER/fabricUser/" -e "s/XXXXXXXX/${privatekeyUser}/" -e "s/ADMIN1STORE/${privatekeyAdmin}/" \
            -e "s^FABSAMPLE^${fabric_network_dir}^" < datasources.json.template > datasources.json
    fi
fi

if [[ -n $start_server ]]; then
    cd ..
    if [[ -n $debug ]]; then
        node . --hfc-logging '{"debug":"console"}'
    else
        node .
    fi
fi
