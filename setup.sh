#!/bin/bash -
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Setup the Fabric SDK REST server:
#
# - Update data sources
# - Generate files for TLS support
# - Generate a populated datasources.json file
#
# E.g.,
# ./setup.sh -tukaf ~/fabric-samples/first-network


_show_help() {
    printf -- "Usage: setup.sh OPTIONS\n\n"
    printf -- "Options:\n"
    printf -- "-t Generate files for TLS support\n"
    printf -- "-u Update data sources\n"
    printf -- "-k Update keys\n"
    printf -- "-f Fabric network dir\n"
    printf -- "-a Run as Admin, not User1\n"
    exit 12
}

if [[ -z "$1" ]]; then
    _show_help
fi

while getopts :tukf:ah opt; do
    case "$opt" in
        t)    use_https=true
              ;;
        u)    update_data_sources=true
              ;;
        k)    update_keys=true
              ;;
        f)    fabric_network_dir="${OPTARG%/}"
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


# Determine the private keys for the normal and admin users
if [[ -n $update_keys ]]; then
    cd "${fabric_network_dir}/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"
    privatekeyUser="$(ls *_sk)"
    cd "${fabric_network_dir}/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
    privatekeyAdmin="$(ls *_sk)"

    printf -- "Fabric network directory: ${fabric_network_dir}\n"
    printf -- "Private user key: $privatekeyUser\n"
    printf -- "Private admin key: $privatekeyAdmin\n"
fi


# Make the fabric-rest-server script executable
cd "${project_dir}/packages/fabric-rest/"
chmod u+x ./fabric-rest-server


# Generate files for TLS support
cd "server"
if [[ -n $use_https ]]; then
    mkdir -p private
    cd private
    if [[ ! -f privatekey.pem ]]; then
        openssl req -x509 -newkey rsa:4096 -keyout privatekey.pem -out certificate.pem \
                -days 365 -subj "/C=US/ST=Oregon/L=Portland/O=Company Name/OU=Org/CN=www.example.com" -nodes
    fi
    cd ..
fi


# Generate a populated datasources.json file
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
